// Synthetic historical accident data for Mysuru demo
// Source: "synthetic" — clearly labeled, NOT real crash data
// Locations based on known high-traffic junctions in Mysuru

export const seedAccidents = [
  // Irwin Road / KRS Road junction area
  { lat: 12.3100, lng: 76.6550, severity: 3, timestamp: '2024-08-15T08:30:00Z', source: 'synthetic' },
  { lat: 12.3105, lng: 76.6545, severity: 2, timestamp: '2024-06-22T17:45:00Z', source: 'synthetic' },
  { lat: 12.3098, lng: 76.6553, severity: 2, timestamp: '2024-09-10T19:20:00Z', source: 'synthetic' },
  { lat: 12.3102, lng: 76.6548, severity: 1, timestamp: '2024-04-05T07:00:00Z', source: 'synthetic' },
  { lat: 12.3097, lng: 76.6556, severity: 3, timestamp: '2024-11-18T21:10:00Z', source: 'synthetic' },
  { lat: 12.3108, lng: 76.6542, severity: 1, timestamp: '2024-07-30T10:15:00Z', source: 'synthetic' },

  // Hunsur Road near Ring Road junction
  { lat: 12.3150, lng: 76.6300, severity: 3, timestamp: '2024-05-12T18:30:00Z', source: 'synthetic' },
  { lat: 12.3155, lng: 76.6305, severity: 2, timestamp: '2024-08-08T06:45:00Z', source: 'synthetic' },
  { lat: 12.3148, lng: 76.6298, severity: 2, timestamp: '2024-10-01T20:00:00Z', source: 'synthetic' },
  { lat: 12.3153, lng: 76.6303, severity: 3, timestamp: '2024-03-14T22:30:00Z', source: 'synthetic' },
  { lat: 12.3146, lng: 76.6308, severity: 1, timestamp: '2024-12-05T09:00:00Z', source: 'synthetic' },

  // Mysore–Bangalore Highway (NH 275) near Mysuru
  { lat: 12.3350, lng: 76.6800, severity: 3, timestamp: '2024-01-20T05:30:00Z', source: 'synthetic' },
  { lat: 12.3355, lng: 76.6805, severity: 3, timestamp: '2024-04-18T23:15:00Z', source: 'synthetic' },
  { lat: 12.3348, lng: 76.6795, severity: 2, timestamp: '2024-07-22T16:00:00Z', source: 'synthetic' },
  { lat: 12.3360, lng: 76.6810, severity: 2, timestamp: '2024-09-30T07:45:00Z', source: 'synthetic' },
  { lat: 12.3345, lng: 76.6798, severity: 1, timestamp: '2024-11-02T12:30:00Z', source: 'synthetic' },
  { lat: 12.3353, lng: 76.6802, severity: 3, timestamp: '2024-06-08T02:00:00Z', source: 'synthetic' },

  // Sayyaji Rao Road (city center)
  { lat: 12.3050, lng: 76.6560, severity: 1, timestamp: '2024-02-14T11:00:00Z', source: 'synthetic' },
  { lat: 12.3055, lng: 76.6555, severity: 1, timestamp: '2024-05-20T14:30:00Z', source: 'synthetic' },
  { lat: 12.3048, lng: 76.6562, severity: 2, timestamp: '2024-08-28T18:45:00Z', source: 'synthetic' },
  { lat: 12.3052, lng: 76.6558, severity: 1, timestamp: '2024-10-15T09:15:00Z', source: 'synthetic' },

  // Bogadi Road
  { lat: 12.2900, lng: 76.6350, severity: 2, timestamp: '2024-03-08T17:00:00Z', source: 'synthetic' },
  { lat: 12.2905, lng: 76.6355, severity: 2, timestamp: '2024-06-15T19:30:00Z', source: 'synthetic' },
  { lat: 12.2898, lng: 76.6348, severity: 3, timestamp: '2024-09-22T21:45:00Z', source: 'synthetic' },
  { lat: 12.2903, lng: 76.6352, severity: 1, timestamp: '2024-12-01T08:00:00Z', source: 'synthetic' },

  // Nanjangud Road
  { lat: 12.2800, lng: 76.6600, severity: 3, timestamp: '2024-02-28T06:00:00Z', source: 'synthetic' },
  { lat: 12.2805, lng: 76.6605, severity: 2, timestamp: '2024-07-14T15:30:00Z', source: 'synthetic' },
  { lat: 12.2798, lng: 76.6598, severity: 2, timestamp: '2024-10-20T20:15:00Z', source: 'synthetic' },
  { lat: 12.2808, lng: 76.6608, severity: 1, timestamp: '2024-04-02T10:45:00Z', source: 'synthetic' },

  // Additional scatter points across Mysuru for heatmap coverage
  { lat: 12.3200, lng: 76.6400, severity: 1, timestamp: '2024-05-05T13:00:00Z', source: 'synthetic' },
  { lat: 12.3000, lng: 76.6700, severity: 2, timestamp: '2024-08-18T16:30:00Z', source: 'synthetic' },
  { lat: 12.3250, lng: 76.6650, severity: 1, timestamp: '2024-11-25T11:15:00Z', source: 'synthetic' },
  { lat: 12.2950, lng: 76.6450, severity: 2, timestamp: '2024-06-30T07:30:00Z', source: 'synthetic' },
  { lat: 12.3180, lng: 76.6520, severity: 1, timestamp: '2024-09-12T14:00:00Z', source: 'synthetic' },
];
