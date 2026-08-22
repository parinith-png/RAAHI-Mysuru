import { useState, useCallback, useRef, useEffect } from 'react';
import SafetyMap from './components/SafetyMap.jsx';
import MapLegend from './components/MapLegend.jsx';
import SearchBar from './components/SearchBar.jsx';
import RoutePlanner from './components/RoutePlanner.jsx';
import ReportSheet from './components/ReportSheet.jsx';
import DriveMode from './components/DriveMode.jsx';
import RiskTimeline from './components/RiskTimeline.jsx';
import Disclaimer from './components/Disclaimer.jsx';
import { useFirestoreFlags } from './hooks/useFirestoreFlags.js';
import { useGeolocation } from './hooks/useGeolocation.js';
import { seedAccidents } from './data/seedAccidents.js';
import { scorePoint } from './utils/riskEngine.js';
import { fetchOSRMRoute } from './utils/routing.js';

export default function App() {
  // State
  const [view, setView] = useState('map'); // 'map' | 'drive'
  const [showReport, setShowReport] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [alternateRoute, setAlternateRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [demoPosition, setDemoPosition] = useState(null);
  const [mapRisk, setMapRisk] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Processed Accident Datasets
  const [mapMode, setMapMode] = useState('mysuru'); // 'mysuru' | 'karnataka'
  const [mysuruAccidents, setMysuruAccidents] = useState([]);
  const [karnatakaCells, setKarnatakaCells] = useState([]);
  const [stats, setStats] = useState(null);

  // Load geojson data asynchronously on mount to prevent bundling bloat
  useEffect(() => {
    // 1. Fetch Mysuru Accidents detailed points list
    fetch('/data/processed/mysuru_accidents.geojson')
      .then(res => res.json())
      .then(data => {
        if (data && data.features) {
          const points = data.features.map(f => ({
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            severity: f.properties.historical_severity_weight,
            label: f.properties.severity_label,
            road: f.properties.road,
            year: f.properties.year
          }));
          setMysuruAccidents(points);
        }
      })
      .catch(err => console.warn('Failed to load Mysuru accidents GeoJSON:', err));

    // 2. Fetch Karnataka risk cells
    fetch('/data/processed/karnataka_risk_cells.geojson')
      .then(res => res.json())
      .then(data => {
        if (data && data.features) {
          setKarnatakaCells(data.features);
        }
      })
      .catch(err => console.warn('Failed to load Karnataka risk cells GeoJSON:', err));

    // 3. Fetch accident stats registry
    fetch('/data/processed/accident_stats.json')
      .then(res => res.json())
      .then(data => {
        setStats(data);
      })
      .catch(err => console.warn('Failed to load stats registry JSON:', err));
  }, []);

  // Hooks
  const { flags, usingLocal } = useFirestoreFlags();
  const { position: userLocation, getCurrentPosition } = useGeolocation();

  const mapRef = useRef(null);

  const handleMapReady = useCallback((mapController) => {
    mapRef.current = mapController;
  }, []);

  // Search destination → get OSRM directions
  const handleSearch = useCallback(async (dest) => {
    setDestination(dest);
    setRouteLoading(true);

    try {
      const origin = userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : { lat: 12.298, lng: 76.645 }; // Default Mysuru center

      const resultRoutes = await fetchOSRMRoute(origin, { lat: dest.lat, lng: dest.lng });

      if (resultRoutes && resultRoutes.length > 0) {
        setRoutes(resultRoutes);
        setSelectedRoute(resultRoutes[0]);
        if (resultRoutes.length > 1) {
          setAlternateRoute(resultRoutes[1]);
        } else {
          setAlternateRoute(null);
        }
      }
    } catch (err) {
      console.warn('OSRM Directions failed:', err.message);
    }

    setRouteLoading(false);
  }, [userLocation]);

  const handleClearSearch = useCallback(() => {
    setDestination(null);
    setRoutes(null);
    setSelectedRoute(null);
    setAlternateRoute(null);
  }, []);

  const handleSelectRoute = useCallback((route) => {
    if (routes) {
      const found = routes.find(r => r.routeIndex === route.routeIndex);
      setSelectedRoute(found || route);
      
      const fallbackAlt = routes.find(r => r.routeIndex !== (found?.routeIndex || route.routeIndex));
      setAlternateRoute(fallbackAlt || null);
    }
  }, [routes]);

  const handleStartJourney = useCallback(() => {
    setView('drive');
    setShowLegend(false);
  }, []);

  const handleEndJourney = useCallback(() => {
    setView('map');
    setShowLegend(true);
    setDemoPosition(null);
  }, []);

  const handleReportSubmitted = useCallback((flagData) => {
    console.log('Report submitted:', flagData);
  }, []);

  const handleLocateMe = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      if (mapRef.current && pos) {
        mapRef.current.panTo({ lat: pos.lat, lng: pos.lng });
        mapRef.current.setZoom(15);
        const risk = scorePoint(pos.lat, pos.lng, mysuruAccidents.length > 0 ? mysuruAccidents : seedAccidents, flags);
        setMapRisk(risk);
      }
    } catch (err) {
      console.warn('Location failed:', err.message);
    }
  }, [getCurrentPosition, flags]);

  // Drive mode
  if (view === 'drive') {
    return (
      <DriveMode
        active={true}
        route={selectedRoute}
        flags={flags}
        accidents={mysuruAccidents}
        onEnd={handleEndJourney}
        onPositionUpdate={setDemoPosition}
      />
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Map */}
      <SafetyMap
        flags={flags}
        onMapReady={handleMapReady}
        selectedRoute={selectedRoute}
        alternateRoute={alternateRoute}
        userLocation={userLocation}
        demoPosition={demoPosition}
        mapMode={mapMode}
        mysuruAccidents={mysuruAccidents}
        karnatakaCells={karnatakaCells}
      />

      {/* Search bar */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        loading={routeLoading}
      />

      {/* Map legend */}
      <MapLegend visible={showLegend && !routes} mapMode={mapMode} />

      {/* Top-right controls */}
      <div style={{
        position: 'absolute', top: 76, right: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Locate me button */}
        <button
          onClick={handleLocateMe}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            color: '#3b82f6', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px var(--glass-shadow)',
          }}
          title="My location"
          id="btn-locate-me"
        >
          📍
        </button>

        {/* Toggle legend */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px var(--glass-shadow)',
          }}
          title="Toggle legend"
          id="btn-toggle-legend"
        >
          ℹ️
        </button>

        {/* Toggle timeline */}
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px var(--glass-shadow)',
          }}
          title="Risk timeline"
          id="btn-timeline"
        >
          📊
        </button>
      </div>

      {/* Risk Timeline overlay */}
      {showTimeline && !routes && (
        <div style={{
          position: 'absolute', top: 76, right: 70, zIndex: 999, width: 280,
        }} className="animate-fade-in-up">
          <RiskTimeline baseRisk={mapRisk?.score || 30} />
        </div>
      )}

      {/* Bottom bar — when no route */}
      {!routes && (
        <div className="bottom-sheet" style={{ padding: '0 0 20px', transform: 'translateY(0)' }}>
          <div className="bottom-sheet-handle" />

          {/* Quick stats */}
          <div style={{
            padding: '8px 16px 10px', display: 'flex', gap: 10, justifyContent: 'space-between',
          }}>
            <QuickStat 
              icon="🔥" 
              label={mapMode === 'mysuru' ? 'Crash zones' : 'Karnataka risk cells'} 
              value={mapMode === 'mysuru' ? (mysuruAccidents.length > 0 ? mysuruAccidents.length : seedAccidents.length) : (stats?.karnataka_grid?.aggregated_risk_cells_count || 15199)} 
              color="#ef4444" 
            />
            <QuickStat icon="⚠️" label="Live hazards" value={flags.length} color="#f97316" />
            <QuickStat icon="👁️" label="Blind spots" value="4" color="#8b5cf6" />
          </div>

          {/* Action buttons */}
          <div style={{ padding: '4px 16px 0', display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={() => {
                const input = document.getElementById('search-destination');
                if (input) input.focus();
              }}
              style={{ flex: 1 }}
              id="btn-plan-route"
            >
              🗺️ Plan Safe Route
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowReport(true)}
              style={{ flex: 0 }}
              id="btn-report"
            >
              ⚠️ Report
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: '10px 16px 0' }}>
            <Disclaimer />
          </div>

          {/* Data source */}
          {usingLocal && (
            <div style={{
              padding: '6px 16px 0', fontSize: 10, color: 'var(--text-muted)',
              textAlign: 'center', fontStyle: 'italic',
            }}>
              Using local demo data · Connect Firebase for live community reports
            </div>
          )}
        </div>
      )}

      {/* Route Planner */}
      {routes && (
        <RoutePlanner
          routes={routes}
          destination={destination}
          flags={flags}
          accidents={mysuruAccidents}
          onSelectRoute={handleSelectRoute}
          onStartJourney={handleStartJourney}
          onClose={handleClearSearch}
        />
      )}

      {/* Report Sheet */}
      <ReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        userLocation={userLocation}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Brand header */}
      <div style={{
        position: 'absolute', top: 76, left: 16, zIndex: 998,
        display: routes ? 'none' : 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div className="glass-card" style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em' }}>ROADGUARD</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 500 }}>MYSURU  COMMUNITY ROAD SAFETY</div>
          </div>
        </div>

        {/* Dynamic map-mode toggler */}
        <div className="glass-card" style={{
          padding: '4px', display: 'flex', gap: 4, borderRadius: 20, width: 'fit-content'
        }}>
          <button
            onClick={() => setMapMode('mysuru')}
            style={{
              padding: '6px 12px', borderRadius: 16, border: 'none',
              background: mapMode === 'mysuru' ? '#3b82f6' : 'transparent',
              color: mapMode === 'mysuru' ? '#fff' : 'var(--text-secondary)',
              fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
            id="btn-mode-mysuru"
          >
            📍 Mysuru Map
          </button>
          <button
            onClick={() => setMapMode('karnataka')}
            style={{
              padding: '6px 12px', borderRadius: 16, border: 'none',
              background: mapMode === 'karnataka' ? '#3b82f6' : 'transparent',
              color: mapMode === 'karnataka' ? '#fff' : 'var(--text-secondary)',
              fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
            id="btn-mode-karnataka"
          >
            🏛️ Karnataka Risk
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '8px 4px',
      background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-xs)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
