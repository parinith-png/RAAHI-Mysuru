// Verified speed limit data for key Mysuru roads
// source: "manual_verified" — based on publicly available traffic signage info
// Only includes roads where speed limits can be reasonably verified
// When source is unknown, postedLimit is null

export const speedLimits = [
  {
    roadSegmentId: 'mysuru-nh275-urban',
    roadName: 'NH 275 (Mysuru–Bangalore Highway, Urban Section)',
    postedLimit: 60,
    source: 'manual_verified',
    confidence: 'high',
  },
  {
    roadSegmentId: 'mysuru-hunsur-road',
    roadName: 'Hunsur Road',
    postedLimit: 50,
    source: 'manual_verified',
    confidence: 'medium',
  },
  {
    roadSegmentId: 'mysuru-sayyaji-rao',
    roadName: 'Sayyaji Rao Road',
    postedLimit: 40,
    source: 'manual_verified',
    confidence: 'high',
  },
  {
    roadSegmentId: 'mysuru-irwin-road',
    roadName: 'Irwin Road',
    postedLimit: 40,
    source: 'manual_verified',
    confidence: 'medium',
  },
  {
    roadSegmentId: 'mysuru-bogadi-road',
    roadName: 'Bogadi Road',
    postedLimit: 40,
    source: 'manual_verified',
    confidence: 'medium',
  },
  {
    roadSegmentId: 'mysuru-nanjangud-road',
    roadName: 'Nanjangud Road',
    postedLimit: 50,
    source: 'manual_verified',
    confidence: 'medium',
  },
  {
    roadSegmentId: 'mysuru-ring-road',
    roadName: 'Mysuru Ring Road (Outer)',
    postedLimit: 60,
    source: 'manual_verified',
    confidence: 'medium',
  },
];

// Road name → speed data lookup
// Used as fallback when Roads API is unavailable
export function findSpeedLimit(roadName) {
  if (!roadName) return null;
  const lower = roadName.toLowerCase();
  return speedLimits.find((r) =>
    lower.includes(r.roadName.toLowerCase().split('(')[0].trim().toLowerCase()) ||
    r.roadName.toLowerCase().includes(lower)
  ) || null;
}

// Get speed limit for a coordinate (nearest known road within ~200m)
export function findSpeedLimitNearby(lat, lng) {
  // Approximate road locations for the demo
  const roadLocations = [
    { ...speedLimits[0], lat: 12.3350, lng: 76.6800 },
    { ...speedLimits[1], lat: 12.3150, lng: 76.6300 },
    { ...speedLimits[2], lat: 12.3050, lng: 76.6560 },
    { ...speedLimits[3], lat: 12.3100, lng: 76.6550 },
    { ...speedLimits[4], lat: 12.2900, lng: 76.6350 },
    { ...speedLimits[5], lat: 12.2800, lng: 76.6600 },
    { ...speedLimits[6], lat: 12.3200, lng: 76.6400 },
  ];

  let nearest = null;
  let minDist = Infinity;

  for (const road of roadLocations) {
    const dist = Math.sqrt((road.lat - lat) ** 2 + (road.lng - lng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = road;
    }
  }

  // ~0.002 degrees ≈ 200m
  if (minDist > 0.002) return null;
  return nearest;
}
