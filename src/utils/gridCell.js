// Grid cell ID generator for spatial clustering
// Each cell is approximately 30-50m at Mysuru's latitude (~12.3°N)
// At lat 12.3°: 1° lat ≈ 111km, 1° lng ≈ 108.5km
// 0.0004° ≈ ~44m lat, ~43m lng

const GRID_PRECISION = 0.0004;

export function getGridCellId(lat, lng) {
  const gridLat = Math.round(lat / GRID_PRECISION) * GRID_PRECISION;
  const gridLng = Math.round(lng / GRID_PRECISION) * GRID_PRECISION;
  return `${gridLat.toFixed(4)}_${gridLng.toFixed(4)}`;
}

export function getGridCellCenter(gridCellId) {
  const [lat, lng] = gridCellId.split('_').map(Number);
  return { lat, lng };
}

// Group flags by grid cell
export function clusterFlags(flags) {
  const clusters = {};
  for (const flag of flags) {
    const cellId = flag.gridCellId || getGridCellId(flag.lat, flag.lng);
    if (!clusters[cellId]) {
      clusters[cellId] = {
        gridCellId: cellId,
        center: getGridCellCenter(cellId),
        flags: [],
        devices: new Set(),
      };
    }
    clusters[cellId].flags.push(flag);
    if (flag.createdBy) clusters[cellId].devices.add(flag.createdBy);
  }
  return Object.values(clusters);
}

export { GRID_PRECISION };
