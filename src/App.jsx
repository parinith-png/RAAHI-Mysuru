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

// RAAHI UI Imports
import Splash from './components/Splash.jsx';
import Navigation from './components/Navigation.jsx';
import HomeFeed from './components/HomeFeed.jsx';
import { ProfileView } from './components/ProfileView.jsx';
import { FlagDetailModal } from './components/FlagDetailModal.jsx';
import { MYSURU_LANDMARKS } from './data/landmarks.js';
import { Compass, Info, BarChart3, MapPin, AlertTriangle, Eye, ShieldCheck, HelpCircle, Sparkles, Plus } from 'lucide-react';

// Distance calculation helper
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}

// Find nearest landmark to coordinates
function findNearestLandmark(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const lm of MYSURU_LANDMARKS) {
    const d = calculateDistance(lat, lng, lm.lat, lm.lng);
    if (d < minDist) {
      minDist = d;
      nearest = lm;
    }
  }
  return minDist < 2000 ? nearest.name : null;
}

// Format time ago string
function formatTimeAgo(timestampString) {
  if (!timestampString) return "Recent";
  const date = new Date(timestampString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// Get group classification for home feed
function getDateGroup(timestampString) {
  if (!timestampString) return "Today";
  const date = new Date(timestampString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / 3600000;
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";
  return "Earlier this week";
}

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // RAAHI Shell state
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState('map'); // 'home' | 'map' | 'profile' | 'drive'
  const [localUpvotes, setLocalUpvotes] = useState({});
  const [selectedFlagIdForDetail, setSelectedFlagIdForDetail] = useState(null);

  const [profile, setProfile] = useState({
    id: "user-mys-01",
    displayName: "Ramesh K.",
    email: "ramesh.k@mysuru-citizen.org",
    phone: "+91 98450 12345",
    isGuest: false,
    myFlags: [],
    settings: {
      voiceAlerts: true,
      beepAlerts: true,
      units: "km",
      notificationRadiusMeters: 1500,
    }
  });

  // Map state
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
        : { lat: 12.3100, lng: 76.6450 }; // Mysuru center

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
  }, [getCurrentPosition, flags, mysuruAccidents]);

  const handleUpvoteFlag = useCallback((flagId) => {
    setLocalUpvotes(prev => ({
      ...prev,
      [flagId]: (prev[flagId] || 0) + 1
    }));
  }, []);

  // Map dynamic Firestore flags to match RAAHI's UI-Feed contracts
  const mappedFlags = flags.map(f => {
    // Group categories
    let tabType = 'hazard';
    if (f.type === 'blind_spot') tabType = 'blindspot';
    else if (f.type === 'near_miss' || f.type === 'accident') tabType = 'nearmiss';

    // Proximity formatting
    const lat = f.lat || f.latitude;
    const lng = f.lng || f.longitude;
    const distanceM = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : 1500;
    const distanceText = distanceM < 1000 ? `${Math.round(distanceM)}m away` : `${(distanceM / 1000).toFixed(1)} km away`;

    // Timestamp formatting
    const timeAgo = formatTimeAgo(f.createdAt || f.timestamp);
    const dateGroup = getDateGroup(f.createdAt || f.timestamp);
    const nearestLandmark = findNearestLandmark(lat, lng);

    const baseUpvotes = f.upvotes || 0;
    const dynamicUpvote = baseUpvotes + (localUpvotes[f.id] || 0);

    const countInCell = flags.filter(other => other.gridCellId === f.gridCellId).length;
    const colorTier = countInCell > 2 ? 'red' : 'yellow';

    return {
      id: f.id,
      lat,
      lng,
      gridCellId: f.gridCellId || "mys-grid-cell",
      type: tabType,
      title: f.title || f.subtype || `${f.type ? f.type.toUpperCase().replace('_', ' ') : 'ALERT'} reported`,
      locationName: f.locationName || f.road || nearestLandmark || `Mysuru Road`,
      distanceMeters: distanceM,
      distanceText,
      timestamp: f.createdAt || f.timestamp || new Date().toISOString(),
      timeAgoText: timeAgo,
      dateGroup,
      active: f.active !== false,
      activeFlagCountInCell: countInCell || 1,
      colorTier,
      description: f.description || `Live community road advisory submitted by commuter.`,
      createdBy: f.createdBy || 'Citizen',
      landmarkNear: nearestLandmark,
      upvotes: dynamicUpvote,
      reports: f.notes ? [{ id: 'rn', userName: 'Commuter', timestamp: 'Recent', note: f.notes }] : []
    };
  });

  // Track profile reports
  useEffect(() => {
    if (profile.displayName) {
      const userReports = mappedFlags.filter(
        f => f.createdBy && f.createdBy.toLowerCase() === profile.displayName.toLowerCase()
      );
      if (JSON.stringify(profile.myFlags) !== JSON.stringify(userReports)) {
        setProfile(prev => ({ ...prev, myFlags: userReports }));
      }
    }
  }, [mappedFlags, profile.displayName]);

  // Tab change router
  const handleTabChange = useCallback((newTab) => {
    if (newTab === "flag") {
      setShowReport(true);
    } else {
      setView(newTab);
    }
  }, []);

  // Render Splash
  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  // Drive Mode HUD overlay (Mobile fullscreen view)
  if (view === 'drive' && isMobile) {
    return (
      <DriveMode
        active={true}
        route={selectedRoute}
        flags={flags}
        accidents={mysuruAccidents}
        onEnd={handleEndJourney}
        onPositionUpdate={setDemoPosition}
        inline={false}
      />
    );
  }
  return (
    <div className={`h-screen w-screen relative overflow-hidden bg-[#0A0A0A] font-sans ${view === 'drive' ? 'flex flex-col md:flex-row' : ''}`}>
      
      {/* 1. PERSISTENT SAFETY MAP AT STATE LEVEL (HIDES BUT PRESERVES STATE ON TAB SWAPS) */}
      <div className={`h-full w-full relative ${view === 'drive' ? 'hidden md:block md:w-[60%] lg:w-[65%] border-r border-[#FF4D00]/20' : ''}`}>
        <div style={{ display: (view === 'map' || (view === 'drive' && !isMobile)) ? 'block' : 'none', height: '100%', width: '100%', position: 'absolute' }}>
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
          onSelectFlag={setSelectedFlagIdForDetail}
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
        <div className="absolute top-[76px] right-4 z-[1000] flex flex-col gap-2.5">
          {/* Locate me button */}
          <button
            onClick={handleLocateMe}
            className="w-11 h-11 rounded-full bg-[#121212]/95 border border-white/10 hover:border-white/20 text-[#FF4D00] flex items-center justify-center shadow-2xl focus:outline-none transition-colors"
            title="My location"
            id="btn-locate-me"
          >
            <Compass className="w-5 h-5 animate-pulse" />
          </button>

          {/* Toggle legend */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-2xl focus:outline-none transition-colors ${
              showLegend 
                ? "bg-[#FF4D00] border-[#FF4D00] text-white" 
                : "bg-[#121212]/95 border-white/10 text-white/60 hover:text-white"
            }`}
            title="Toggle legend"
            id="btn-toggle-legend"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Toggle timeline */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-2xl focus:outline-none transition-colors ${
              showTimeline 
                ? "bg-[#FF4D00] border-[#FF4D00] text-white" 
                : "bg-[#121212]/95 border-white/10 text-white/60 hover:text-white"
            }`}
            title="Risk timeline"
            id="btn-timeline"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>

        {/* Risk Timeline overlay */}
        {showTimeline && !routes && (
          <div className="absolute top-[76px] right-[70px] z-[999] w-72 animate-fade-in-up">
            <RiskTimeline baseRisk={mapRisk?.score || 30} />
          </div>
        )}

        {/* Bottom bar — when no active route */}
        {!routes && (
          <div className="absolute bottom-[76px] left-0 right-0 z-[990] w-full max-w-[430px] mx-auto bg-[#0A0A0A]/95 border-t border-white/10 rounded-t-2xl shadow-2xl p-4 flex flex-col gap-3 animate-slide-up">
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto" />

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <QuickStat 
                icon={Sparkles} 
                label={mapMode === 'mysuru' ? 'Crash Zones' : 'Risk Nodes'} 
                value={mapMode === 'mysuru' ? (mysuruAccidents.length > 0 ? mysuruAccidents.length : seedAccidents.length) : 15199} 
                color="text-[#FF4D00] bg-[#FF4D00]/10 border-[#FF4D00]/20" 
              />
              <QuickStat 
                icon={AlertTriangle} 
                label="Hazards" 
                value={flags.length} 
                color="text-[#FF9D00] bg-[#FF9D00]/10 border-[#FF9D00]/20" 
              />
              <QuickStat 
                icon={Eye} 
                label="Corridors" 
                value="4" 
                color="text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20" 
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-xl"
                onClick={() => {
                  const input = document.getElementById('search-destination');
                  if (input) input.focus();
                }}
                id="btn-plan-route"
              >
                <Compass className="w-4 h-4" />
                <span>Search Safe Route</span>
              </button>
              <button
                className="bg-[#121212] border border-white/10 hover:border-white/20 text-white hover:text-[#FF4D00] font-black p-3 rounded-xl transition-all shadow-xl"
                onClick={() => setShowReport(true)}
                id="btn-report"
                title="Pin warning alert"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-white/35 font-medium border-t border-white/5 pt-2.5">
              <Disclaimer />
            </div>

            {/* Data source warning banner */}
            {usingLocal && (
              <div className="text-[9px] text-white/30 font-medium text-center italic mt-0.5">
                Using local buffer array database. Firebase live net offline.
              </div>
            )}
          </div>
        )}

        {/* Route Planner */}
        {routes && view !== 'drive' && (
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

        {/* Brand header branding tag */}
        <div className="absolute top-[76px] left-4 z-[998] flex flex-col gap-2.5 pointer-events-none md:pointer-events-auto">
          {!routes && (
            <>
              <div className="bg-[#121212]/95 border border-white/10 px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
                <span className="text-lg text-[#FF4D00]">🛡️</span>
                <div>
                  <h1 className="text-xs font-black uppercase text-[#FF4D00] tracking-[0.2em] leading-none mb-0.5">RAAHI</h1>
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest block leading-none">MYSURU SAFETY NET</span>
                </div>
              </div>

              {/* Dynamic map-mode toggler */}
              <div className="bg-[#121212]/95 border border-white/10 p-1 rounded-full shadow-2xl flex items-center gap-1 w-fit pointer-events-auto">
                <button
                  onClick={() => setMapMode('mysuru')}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                    mapMode === 'mysuru' 
                      ? "bg-[#FF4D00] text-white shadow-lg" 
                      : "bg-transparent text-white/50 hover:text-white"
                  }`}
                  id="btn-mode-mysuru"
                >
                  Mysuru Map
                </button>
                <button
                  onClick={() => setMapMode('karnataka')}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                    mapMode === 'karnataka' 
                      ? "bg-[#FF4D00] text-white shadow-lg" 
                      : "bg-transparent text-white/50 hover:text-white"
                  }`}
                  id="btn-mode-karnataka"
                >
                  Karnataka Risk
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Drive Mode HUD Right Panel (Desktop side-by-side view) */}
      {view === 'drive' && !isMobile && (
        <div className="w-[380px] lg:w-[420px] h-full shrink-0 relative bg-[#0A0A0A] border-l border-[#FF4D00]/20 z-[1002] flex flex-col justify-between">
          <DriveMode
            active={true}
            route={selectedRoute}
            flags={flags}
            accidents={mysuruAccidents}
            onEnd={handleEndJourney}
            onPositionUpdate={setDemoPosition}
            inline={true}
          />
        </div>
      )}

      {/* 2. RAAHI FEED TAB */}
      {view === 'home' && (
        <div className="h-full w-full overflow-y-auto">
          <HomeFeed
            flags={mappedFlags}
            onUpvoteFlag={handleUpvoteFlag}
            locationEnabled={!!userLocation}
            onEnableLocation={getCurrentPosition}
            onNavigateToMap={() => setView('map')}
          />
        </div>
      )}

      {/* 3. RAAHI PROFILE / HUB TAB */}
      {view === 'profile' && (
        <div className="h-full w-full overflow-y-auto">
          <ProfileView
            profile={profile}
            cityFlagCount={flags.length}
            onUpdateProfile={setProfile}
          />
        </div>
      )}

      {/* Persistent Navigation bottom tab bar */}
      <Navigation activeTab={view} onTabChange={handleTabChange} isDriving={view === 'drive'} />

      {/* Report Sheet Modal */}
      <ReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        userLocation={userLocation}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Flag Detail Modal */}
      {selectedFlagIdForDetail && (
        <FlagDetailModal
          flag={mappedFlags.find(f => f.id === selectedFlagIdForDetail)}
          onClose={() => setSelectedFlagIdForDetail(null)}
          onUpvote={handleUpvoteFlag}
        />
      )}
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${color}`}>
      <Icon className="w-4 h-4 mb-1 shrink-0" />
      <span className="text-base font-black text-white leading-none">{value}</span>
      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1 block leading-none">{label}</span>
    </div>
  );
}
