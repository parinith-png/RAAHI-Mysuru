// OSRM Public Routing Client

// Format meters to human readable string (e.g., "4.2 km" or "850 m")
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Format seconds to human readable string (e.g., "15 mins" or "1 hr 5 mins")
function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs} hr ${remMins} mins` : `${hrs} hr`;
  }
  return `${mins} mins`;
}

/**
 * Fetch directions from OSRM demo server.
 * Returns a list of routes structured similarly to Google Maps DirectionsResult
 * to minimize refactoring across components.
 */
export async function fetchOSRMRoute(origin, destination) {
  if (!origin || !destination) {
    throw new Error('OSRM Route requires clear origin and destination coordinates.');
  }

  // OSRM expects coordinates in lng,lat format
  const coordsString = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&alternatives=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OSRM API error: status ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes returned by OSRM.');
    }

    // Map OSRM routes to Google-like DirectionsResult structure
    return data.routes.map((route, idx) => {
      // Decode GeoJSON coordinates
      const coords = route.geometry.coordinates.map(([lng, lat]) => ({
        lat,
        lng,
      }));

      // Find route summary (primary roads)
      const summary = route.legs?.[0]?.steps
        ?.map(s => s.name)
        .filter(name => name && name !== '')
        .slice(0, 2)
        .join(' / ') || route.legs?.[0]?.summary || `Route ${idx + 1}`;

      return {
        legs: [
          {
            distance: { text: formatDistance(route.distance), value: route.distance },
            duration: { text: formatDuration(route.duration), value: route.duration },
            start_location: origin,
            end_location: destination,
          },
        ],
        overview_path: coords,
        // Keep the original geojson geometry for easy rendering on Leaflet
        geometry: route.geometry,
        summary: summary || `Roads`,
        routeIndex: idx,
      };
    });
  } catch (err) {
    console.error('OSRM Fetch Failed:', err);
    throw err;
  }
}
