import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { seedAccidents } from '../data/seedAccidents.js';
import { seedBlindSpots } from '../data/seedFlags.js';
import { clusterFlags } from '../utils/gridCell.js';
import { calculateClusterConfidence } from '../utils/flagVerification.js';
import { getLatLng } from '../utils/riskEngine.js';

const MYSURU_CENTER = { lat: 12.298, lng: 76.645 };
const MYSURU_ZOOM = 13;

export default function SafetyMap({
  flags,
  onMapReady,
  selectedRoute,
  alternateRoute,
  userLocation,
  onMapClick,
  demoPosition,
  mapMode = 'mysuru',
  mysuruAccidents = [],
  karnatakaCells = [],
  onSelectFlag
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // References to keep track of added Leaflet layers for direct manipulation
  const layersRef = useRef({
    tile: null,
    accidents: [],
    blindspots: [],
    flags: [],
    selectedRoute: null,
    alternateRoute: null,
    userMarker: null,
  });

  // 1. Initialize Map Container
  useEffect(() => {
    if (!containerRef.current) return;

    // Remove any previously existing Leaflet Map instances associated with the container
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapReady(false);
    }

    const map = L.map(containerRef.current, {
      center: [MYSURU_CENTER.lat, MYSURU_CENTER.lng],
      zoom: MYSURU_ZOOM,
      zoomControl: false,
    });

    mapRef.current = map;

    // Load CartoDB Dark Matter tiles
    const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).addTo(map);

    layersRef.current.tile = tiles;

    // Setup map click handlers
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    setMapReady(true);

    // Call ready handler for parent components
    if (onMapReady) {
      onMapReady({
        panTo: (coords) => {
          const pt = getLatLng(coords);
          if (pt) map.panTo([pt.lat, pt.lng]);
        },
        setZoom: (zoom) => {
          map.setZoom(zoom);
        },
        fitBounds: (bounds) => {
          map.fitBounds(bounds);
        },
        invalidateSize: () => {
          map.invalidateSize();
        }
      }, {});
    }

    // Cleanup: Remove map reference completely to avoid memory / StrictMode double rendering leaks
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, [onMapClick, onMapReady]);

  // 2. Draw Accident Layer (Heatmap in Mysuru, Grid Cells in Karnataka)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    layersRef.current.accidents.forEach(layer => layer.remove());
    layersRef.current.accidents = [];

    const canvRenderer = L.canvas();

    if (mapMode === 'mysuru') {
      const dataToRender = (mysuruAccidents && mysuruAccidents.length > 0) ? mysuruAccidents : seedAccidents;
      
      dataToRender.forEach((a) => {
        const severity = a.severity || a.historical_severity_weight || 1;
        const color = severity >= 5 ? '#FF4D00' : severity >= 3 ? '#FF9000' : '#FFC200';
        
        const circle = L.circleMarker([a.lat, a.lng], {
          renderer: canvRenderer,
          radius: 3.5,
          fillColor: color,
          fillOpacity: 0.15,
          stroke: false,
        }).addTo(map);

        circle.bindPopup(`
          <div style="color: #1a1a2e; font-family: Inter, sans-serif; padding: 2px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 2.5px; color:#FF4D00;">🔥 Historical Accident</div>
            <div style="font-size: 11px; font-weight: 500;">Road: ${a.road || 'Unknown Road'}</div>
            <div style="font-size: 11px;">Severity: ${a.label || (severity >= 5 ? 'Fatal' : severity >= 3 ? 'Grievous' : 'Simple Injury')}</div>
            <div style="font-size: 10px; color: #666; margin-top: 1.5px;">Year: ${a.year || 'N/A'} · Weight: ${severity}</div>
          </div>
        `);

        layersRef.current.accidents.push(circle);
      });

      // Recenter Map on Mysuru view
      map.setView([MYSURU_CENTER.lat, MYSURU_CENTER.lng], MYSURU_ZOOM, { animate: true });
    } else {
      karnatakaCells.forEach((c) => {
        const coords = c.geometry.coordinates; // [lng, lat]
        const props = c.properties;
        const risk = props.historical_risk_score;
        const count = props.accident_count;

        const radius = Math.max(4, Math.min(13, count * 0.45));
        const color = risk >= 80 ? '#FF4D00' : risk >= 30 ? '#FF9000' : '#FFC200';
        
        const circle = L.circleMarker([coords[1], coords[0]], {
          renderer: canvRenderer,
          radius: radius,
          fillColor: color,
          fillOpacity: Math.max(0.18, Math.min(0.68, risk * 0.015)),
          stroke: true,
          color: '#ffffff',
          weight: 0.5,
          opacity: 0.4
        }).addTo(map);

        circle.bindPopup(`
          <div style="color: #1a1a2e; font-family: Inter, sans-serif; padding: 2px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px; color:#FF4D00;">🏛️ Karnataka Risk Cell</div>
            <div style="font-size: 11px; font-weight: 700; color: #FF4D00;">Risk Score: ${risk}</div>
            <div style="font-size: 11px;">Total Accidents: ${count}</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px; border-top: 1px solid #ddd; padding-top: 3px;">
              Fatal: ${props.fatal_count} · Grievous: ${props.grievous_count}<br/>
              Simple: ${props.simple_count} · Damage: ${props.damage_count}
            </div>
            <div style="font-size: 9px; color: #999; margin-top: 2px; font-style: italic;">
              Historical count cells · Not ML prediction
            </div>
          </div>
        `);

        layersRef.current.accidents.push(circle);
      });

      // Reset Map view to showcase rest-of-state grid points
      map.setView([13.5, 76.2], 7, { animate: true });
    }
  }, [mapReady, mapMode, mysuruAccidents, karnatakaCells]);

  // 3. Draw Blindspot zones (Static list)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    layersRef.current.blindspots.forEach(layer => layer.remove());
    layersRef.current.blindspots = [];

    seedBlindSpots.forEach((bs) => {
      const zone = L.circle([bs.lat, bs.lng], {
        radius: bs.radius,
        fillColor: '#8b5cf6',
        fillOpacity: 0.08,
        color: '#8b5cf6',
        weight: 1.5,
        dashArray: '3, 5',
      }).addTo(map);

      const dot = L.circleMarker([bs.lat, bs.lng], {
        radius: 5,
        fillColor: '#8b5cf6',
        fillOpacity: 0.9,
        color: '#fff',
        weight: 1.5,
      }).addTo(map);

      dot.bindPopup(`
        <div style="color: #1a1a2e; font-family: Inter, sans-serif; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px; color:#8b5cf6;">👁️ Blind Spot</div>
          <div style="font-size: 12px; font-weight: 500;">${bs.name}</div>
          <div style="font-size: 11px; color: #666;">${bs.subtype}</div>
        </div>
      `);

      layersRef.current.blindspots.push(zone, dot);
    });
  }, [mapReady]);

  // 4. Draw Community Hazard Flags (Dynamic list)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    layersRef.current.flags.forEach(layer => layer.remove());
    layersRef.current.flags = [];

    const clusters = clusterFlags(flags);

    clusters.forEach((cluster) => {
      const confidence = calculateClusterConfidence(cluster.flags);
      const mainFlag = cluster.flags[0];
      const markerColor = confidence.color === '#ef4444' ? '#FF4D00' : (confidence.color || '#FF8F00');

      const marker = L.circleMarker([cluster.center.lat, cluster.center.lng], {
        radius: 7 + Math.min(7, cluster.flags.length * 1.5),
        fillColor: markerColor,
        fillOpacity: 0.9,
        color: '#fff',
        weight: 2,
      }).addTo(map);

      // Select flag info instead of binding popup
      marker.on('click', () => {
        if (onSelectFlag) {
          onSelectFlag(mainFlag.id);
        }
      });

      layersRef.current.flags.push(marker);
    });
  }, [flags, mapReady, onSelectFlag]);

  // 5. Draw Routes (Dynamic Selected / Alternate paths)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (layersRef.current.selectedRoute) {
      layersRef.current.selectedRoute.remove();
      layersRef.current.selectedRoute = null;
    }
    if (layersRef.current.alternateRoute) {
      layersRef.current.alternateRoute.remove();
      layersRef.current.alternateRoute = null;
    }

    if (alternateRoute?.overview_path) {
      const coords = alternateRoute.overview_path.map(p => {
        const pt = getLatLng(p);
        return [pt.lat, pt.lng];
      });
      layersRef.current.alternateRoute = L.polyline(coords, {
        color: '#475569',
        weight: 4,
        opacity: 0.5,
      }).addTo(map);
    }

    if (selectedRoute?.overview_path) {
      const coords = selectedRoute.overview_path.map(p => {
        const pt = getLatLng(p);
        return [pt.lat, pt.lng];
      });
      layersRef.current.selectedRoute = L.polyline(coords, {
        color: '#10b981',
        weight: 6,
        opacity: 0.9,
      }).addTo(map);

      map.fitBounds(coords, { padding: [40, 40] });
    }
  }, [selectedRoute, alternateRoute, mapReady]);

  // 6. Draw User Track Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (layersRef.current.userMarker) {
      layersRef.current.userMarker.remove();
      layersRef.current.userMarker = null;
    }

    const activePos = getLatLng(demoPosition || userLocation);
    if (activePos) {
      const marker = L.circleMarker([activePos.lat, activePos.lng], {
        radius: 8,
        fillColor: '#3b82f6',
        fillOpacity: 0.95,
        color: '#ffffff',
        weight: 2,
      }).addTo(map);

      marker.bindPopup('<span style="color:#1a1a2e;font-size:11px;font-weight:600">Your active position</span>');
      layersRef.current.userMarker = marker;

      map.setView([activePos.lat, activePos.lng], map.getZoom(), { animate: true });
    }
  }, [demoPosition, userLocation, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        background: '#0e1626',
        position: 'relative',
        zIndex: 1,
      }}
    />
  );
}
