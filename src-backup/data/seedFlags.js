// Demo community flags — synthetic data for demonstration
// All flags are labeled as demo/synthetic data

export const seedFlags = [
  // Pothole on Hunsur Road
  {
    lat: 12.3148,
    lng: 76.6295,
    type: 'hazard',
    subtype: 'Pothole',
    active: true,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    createdBy: 'demo-device-001',
    source: 'synthetic',
  },
  // Waterlogging near Bogadi Road
  {
    lat: 12.2902,
    lng: 76.6348,
    type: 'hazard',
    subtype: 'Waterlogging',
    active: true,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdBy: 'demo-device-002',
    source: 'synthetic',
  },
  // Poor visibility on NH 275
  {
    lat: 12.3352,
    lng: 76.6800,
    type: 'hazard',
    subtype: 'Poor visibility',
    active: true,
    timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'demo-device-003',
    source: 'synthetic',
  },
  // Near miss at Sayyaji Rao Road
  {
    lat: 12.3055,
    lng: 76.6558,
    type: 'nearmiss',
    subtype: 'Near miss',
    active: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'demo-device-004',
    source: 'synthetic',
  },
  // Confirmed pothole (multiple reports nearby)
  {
    lat: 12.3149,
    lng: 76.6296,
    type: 'hazard',
    subtype: 'Pothole',
    active: true,
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'demo-device-005',
    source: 'synthetic',
  },
  // Debris on Irwin Road
  {
    lat: 12.3103,
    lng: 76.6548,
    type: 'hazard',
    subtype: 'Debris',
    active: true,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdBy: 'demo-device-006',
    source: 'synthetic',
  },
];

export const seedBlindSpots = [
  {
    lat: 12.3100,
    lng: 76.6550,
    radius: 100,
    subtype: 'Sharp curve with limited visibility',
    name: 'Irwin Road Junction',
    source: 'synthetic',
  },
  {
    lat: 12.3150,
    lng: 76.6300,
    radius: 120,
    subtype: 'T-junction with obstructed sightline',
    name: 'Hunsur Road Ring Road Junction',
    source: 'synthetic',
  },
  {
    lat: 12.3350,
    lng: 76.6800,
    radius: 150,
    subtype: 'Highway merge with limited visibility',
    name: 'NH 275 Mysuru Entry',
    source: 'synthetic',
  },
  {
    lat: 12.2900,
    lng: 76.6350,
    radius: 80,
    subtype: 'Narrow road with sharp turn',
    name: 'Bogadi Road Bend',
    source: 'synthetic',
  },
];
