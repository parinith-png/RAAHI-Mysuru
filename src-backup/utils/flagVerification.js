// Community flag verification with time decay and independent device confirmation

// Time decay weights
function getTimeDecay(timestampStr) {
  const ageMs = Date.now() - new Date(timestampStr).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 2) return 1.0;
  if (ageHours < 6) return 0.75;
  if (ageHours < 24) return 0.4;
  return 0.1;
}

// Calculate confidence for a cluster of flags
export function calculateClusterConfidence(flags) {
  if (!flags || flags.length === 0) return { level: 'none', score: 0, label: 'No reports' };

  // Independent devices
  const devices = new Set(flags.map((f) => f.createdBy).filter(Boolean));
  const independentCount = devices.size;

  // Weighted report score
  let totalWeight = 0;
  for (const flag of flags) {
    totalWeight += getTimeDecay(flag.timestamp);
  }

  // Determine confidence level
  if (independentCount >= 4 && totalWeight >= 2) {
    return { level: 'high', score: totalWeight, label: 'High confidence', color: '#ef4444', independentCount };
  }
  if (independentCount >= 2 && totalWeight >= 1) {
    return { level: 'confirmed', score: totalWeight, label: 'Confirmed', color: '#f97316', independentCount };
  }
  return { level: 'unconfirmed', score: totalWeight, label: 'Unconfirmed', color: '#eab308', independentCount };
}

// Check if a flag is still active (hasn't expired)
export function isFlagActive(flag) {
  if (!flag.active) return false;
  const ageMs = Date.now() - new Date(flag.timestamp).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Permanent hazard types last longer
  const permanentTypes = ['Pothole', 'Broken road'];
  const maxAge = permanentTypes.includes(flag.subtype) ? 72 : 24;

  return ageHours < maxAge;
}

export { getTimeDecay };
