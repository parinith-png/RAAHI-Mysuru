// Route risk scoring engine
// Formula: 0.45 * historicalRisk + 0.35 * communityRisk + 0.20 * temporalRisk

const NEARBY_RADIUS_DEG = 0.001; // ~111m

// Safe coordinate extractor
export function getLatLng(point) {
  if (!point) return null;

  if (typeof point.lat === 'function' && typeof point.lng === 'function') {
    return {
      lat: point.lat(),
      lng: point.lng(),
    };
  }

  if (typeof point.lat === 'number' && typeof point.lng === 'number') {
    return {
      lat: point.lat,
      lng: point.lng,
    };
  }

  // Support leaflet LatLng arrays [lat, lng] or [lng, lat] (Leaflet uses [lat, lng])
  if (Array.isArray(point) && point.length >= 2) {
    return {
      lat: point[0],
      lng: point[1],
    };
  }

  return null;
}

// Haversine approximation in meters
export function distanceMeters(lat1, lng1, lat2, lng2) {
  let l1, g1, l2, g2;
  if (typeof lat1 === 'object' && lat1 !== null) {
    const p1 = getLatLng(lat1);
    const p2 = getLatLng(lng1);
    if (!p1 || !p2) return 0;
    l1 = p1.lat;
    g1 = p1.lng;
    l2 = p2.lat;
    g2 = p2.lng;
  } else {
    l1 = lat1;
    g1 = lng1;
    l2 = lat2;
    g2 = lng2;
  }

  const R = 6371000; // Radius of the earth in meters
  const dLat = (l2 - l1) * Math.PI / 180;
  const dLon = (g2 - g1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * Math.PI / 180) * Math.cos(l2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fast check using degrees for small bounding box filtering
function distanceDeg(lat1, lng1, lat2, lng2) {
  return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
}

// Calculate historical risk for a point
function historicalRiskAtPoint(lat, lng, accidents) {
  let score = 0;
  for (const a of accidents) {
    const dist = distanceDeg(lat, lng, a.lat, a.lng);
    if (dist < NEARBY_RADIUS_DEG) {
      const weight = a.severity || 1;
      const proximity = 1 - (dist / NEARBY_RADIUS_DEG);
      score += weight * proximity;
    }
  }
  return Math.min(score * 15, 100); // normalize to 0–100
}

// Calculate community risk for a point
function communityRiskAtPoint(lat, lng, flags) {
  let score = 0;
  const activeFlags = flags.filter((f) => f.active);
  for (const f of activeFlags) {
    const dist = distanceDeg(lat, lng, f.lat, f.lng);
    if (dist < NEARBY_RADIUS_DEG) {
      const ageMs = Date.now() - new Date(f.timestamp).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      let decay = 1.0;
      if (ageHours > 2) decay = 0.75;
      if (ageHours > 6) decay = 0.4;
      if (ageHours > 24) decay = 0.1;
      score += decay * 20;
    }
  }
  return Math.min(score, 100);
}

// Calculate temporal risk (time-of-day)
function temporalRisk() {
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 20) return 70; // evening rush
  if (hour >= 7 && hour <= 9) return 50;   // morning rush
  if (hour >= 21 || hour <= 5) return 60;  // nighttime
  return 20; // daytime
}

// Get risk tier from score
export function getRiskTier(score) {
  if (score >= 80) return { tier: 'critical', label: 'CRITICAL', color: '#ef4444' };
  if (score >= 60) return { tier: 'high', label: 'HIGH', color: '#f97316' };
  if (score >= 30) return { tier: 'moderate', label: 'MODERATE', color: '#eab308' };
  return { tier: 'low', label: 'LOW', color: '#22c55e' };
}

// Score a single point
export function scorePoint(lat, lng, accidents, flags) {
  const hist = historicalRiskAtPoint(lat, lng, accidents);
  const comm = communityRiskAtPoint(lat, lng, flags);
  const temp = temporalRisk();

  const score = Math.round(0.45 * hist + 0.35 * comm + 0.20 * temp);
  return {
    score: Math.min(score, 100),
    historical: Math.round(hist),
    community: Math.round(comm),
    temporal: Math.round(temp),
    ...getRiskTier(Math.min(score, 100)),
  };
}

// Score a complete route by sampling points along it (expects array of standard coords or Leaflet LatLng points)
export function scoreRoute(routePath, accidents, flags) {
  if (!routePath || routePath.length === 0) return { score: 0, ...getRiskTier(0), segments: [] };

  // Sample every ~100m (roughly 0.001 degrees)
  const sampleInterval = Math.max(1, Math.floor(routePath.length / 30));
  const sampledPoints = [];
  for (let i = 0; i < routePath.length; i += sampleInterval) {
    sampledPoints.push(getLatLng(routePath[i]));
  }
  // Always include last point
  if (sampledPoints[sampledPoints.length - 1] !== getLatLng(routePath[routePath.length - 1])) {
    sampledPoints.push(getLatLng(routePath[routePath.length - 1]));
  }

  let totalScore = 0;
  let highRiskZones = 0;
  let activeHazards = 0;
  const segments = [];

  for (const pt of sampledPoints) {
    if (!pt) continue;
    const ptScore = scorePoint(pt.lat, pt.lng, accidents, flags);
    totalScore += ptScore.score;
    if (ptScore.score >= 60) highRiskZones++;
    segments.push(ptScore);

    // Count nearby active flags
    for (const f of flags) {
      if (f.active && distanceDeg(pt.lat, pt.lng, f.lat, f.lng) < NEARBY_RADIUS_DEG) {
        activeHazards++;
      }
    }
  }

  const avgScore = Math.round(totalScore / Math.max(1, sampledPoints.length));
  return {
    score: Math.min(avgScore, 100),
    highRiskZones,
    activeHazards: Math.min(activeHazards, 20), // cap display
    segments,
    ...getRiskTier(Math.min(avgScore, 100)),
  };
}

// Score a route from lat/lng array
export function scoreRouteFromCoords(coords, accidents, flags) {
  return scoreRoute(coords, accidents, flags);
}

// Risk explanation generator
export function explainRisk(riskData) {
  const factors = [];
  if (riskData.historical >= 60) factors.push('historical crash concentration');
  else if (riskData.historical >= 30) factors.push('moderate historical crash history');

  if (riskData.community >= 60) factors.push('high community hazard density');
  else if (riskData.community >= 30) factors.push('recent community reports nearby');

  if (riskData.temporal >= 60) factors.push('elevated time-of-day risk');
  else if (riskData.temporal >= 40) factors.push('moderate time-of-day factor');

  if (factors.length === 0) factors.push('low overall risk indicators');

  return `Predicted road-safety risk based on: ${factors.join(', ')}.`;
}

export { temporalRisk, NEARBY_RADIUS_DEG };
