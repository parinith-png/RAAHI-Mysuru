import { useState } from 'react';
import { scoreRoute } from '../utils/riskEngine.js';
import { seedAccidents } from '../data/seedAccidents.js';
import SpeedGuidance from './SpeedGuidance.jsx';
import { ShieldCheck, AlertTriangle, Play, ChevronRight, X, Clock, MapPin, Milestone } from 'lucide-react';

export default function RoutePlanner({
  routes,
  destination,
  flags,
  accidents,
  onSelectRoute,
  onStartJourney,
  onClose,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  if (!routes || routes.length === 0) return null;

  const scoredRoutes = routes.map((route, idx) => {
    const leg = route.legs[0];
    const path = route.overview_path;
    const risk = scoreRoute(path, accidents && accidents.length > 0 ? accidents : seedAccidents, flags);

    return {
      ...route,
      routeIndex: idx,
      distance: leg.distance.text,
      duration: leg.duration.text,
      risk,
      summary: route.summary,
    };
  });

  // Sort by risk score (lower = recommended)
  const sorted = [...scoredRoutes].sort((a, b) => a.risk.score - b.risk.score);
  const recommendedIdx = sorted.findIndex(r => r.routeIndex === 0);

  const handleSelect = (idx) => {
    setSelectedIdx(idx);
    if (onSelectRoute) onSelectRoute(sorted[idx]);
  };

  const selectedRoute = sorted[selectedIdx];

  const getRiskLabel = (score) => {
    if (score < 30) return { text: "LOWER RISK", color: "text-[#00E5A3] bg-[#00E5A3]/10 border-[#00E5A3]/25" };
    if (score < 60) return { text: "MODERATE RISK", color: "text-[#FF9D00] bg-[#FF9D00]/10 border-[#FF9D00]/25" };
    return { text: "DANGER ZONE", color: "text-[#FF4D00] bg-[#FF4D00]/10 border-[#FF4D00]/25" };
  };

  return (
    <div className="absolute bottom-[76px] left-0 right-0 z-[1000] w-full max-w-[430px] mx-auto bg-[#0A0A0A]/95 border-t border-white/10 rounded-t-2xl shadow-2xl p-4 space-y-4 max-h-[82vh] overflow-y-auto animate-slide-up">
      {/* Handle decoration */}
      <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-1" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4D00] flex items-center gap-1.5">
            <Milestone className="w-3.5 h-3.5" />
            Safe Corridor Routing
          </span>
          <h2 className="text-sm font-black uppercase text-white mt-1 tracking-tight truncate max-w-[280px]">
            {destination?.name || 'Corridor Route'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Route options list */}
      <div className="space-y-3">
        {sorted.map((route, idx) => {
          const isRecommended = route.routeIndex === sorted[0].routeIndex;
          const isSelected = idx === selectedIdx;
          const riskDetails = route.risk;
          const riskBadge = getRiskLabel(riskDetails.score);

          return (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? isRecommended
                    ? "bg-[#121A26] border-[#10B981] shadow-xl shadow-emerald-950/40 ring-1 ring-[#10B981]/50 scale-[1.01]"
                    : "bg-[#121A26] border-[#FF4D00] shadow-xl shadow-orange-950/40 ring-1 ring-[#FF4D00]/50 scale-[1.01]"
                  : "bg-[#0B111A] border-white/10 opacity-70 hover:opacity-100 hover:border-white/20"
              }`}
            >
              {/* Labels & Tags */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                {isRecommended && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#00E5A3]/10 border border-[#00E5A3]/20 text-[#00E5A3] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    RECOMMENDED
                  </span>
                )}
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${riskBadge.color}`}>
                  {riskBadge.text}
                </span>
              </div>

              {/* Distances & Times */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-base font-black text-white flex items-center gap-2">
                    <span>{route.duration}</span>
                    <span className="text-white/30 text-xs font-medium">({route.distance})</span>
                  </div>
                  <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider mt-1 truncate max-w-[200px]">
                    via {route.summary}
                  </div>
                </div>

                {/* Score badge */}
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight" style={{ color: riskDetails.score < 30 ? "#00E5A3" : riskDetails.score < 60 ? "#FF9D00" : "#FF4D00" }}>
                    {riskDetails.score}
                  </div>
                  <div className="text-[8px] text-white/40 font-black uppercase tracking-wider mt-0.5">Risk Score</div>
                </div>
              </div>

              {/* High risk highlights */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] bg-[#1a1a1a] p-2.5 rounded-lg border border-white/5 text-white/70 font-medium">
                <div>
                  <span className="text-white/45 block text-[8px] uppercase font-black tracking-widest mb-0.5">High-Risk Cells</span>
                  <span className="text-white font-black">{riskDetails.highRiskZones} zones</span>
                </div>
                <div className="border-l border-white/10 pl-2.5">
                  <span className="text-white/45 block text-[8px] uppercase font-black tracking-widest mb-0.5">Hazards Marked</span>
                  <span className="text-white font-black">{riskDetails.activeHazards} active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Route Risk Profile */}
      {selectedRoute && (
        <div className="bg-[#121212] p-3.5 rounded-xl border border-white/10 space-y-2">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40 block">Route Safety Segment Profile</span>
          <RouteRiskProfile segments={selectedRoute.risk.segments} />
        </div>
      )}

      {/* Selected Route Speed Guidance */}
      {selectedRoute && selectedRoute.legs && (
        <div className="bg-[#121212] p-3.5 rounded-xl border border-white/10">
          <SpeedGuidance
            lat={selectedRoute.legs[0].start_location.lat}
            lng={selectedRoute.legs[0].start_location.lng}
            riskScore={selectedRoute.risk.score}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onStartJourney && onStartJourney(selectedRoute)}
          className="flex-1 bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-xl"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Simulation HUD</span>
        </button>
      </div>

      {/* Footer advice */}
      <p className="text-[9px] text-white/30 font-medium text-center italic tracking-wide">
        Advisories represent aggregations of 8,190 Mysuru historical points and community Firestore reports. Always monitor live road conditions.
      </p>
    </div>
  );
}

function RouteRiskProfile({ segments }) {
  if (!segments || segments.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex h-2.5 rounded-lg overflow-hidden gap-[2px]">
        {segments.map((seg, i) => {
          // Map colors to RAAHI specs
          const score = seg.score;
          let safeColor = "#00E5A3";
          if (score >= 60) safeColor = "#FF4D00";
          else if (score >= 30) safeColor = "#FF9D00";

          return (
            <div
              key={i}
              className="flex-1 transition-opacity duration-200 hover:opacity-15"
              style={{
                backgroundColor: safeColor,
              }}
              title={`Section hazard: ${safeColor} (Score: ${score})`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] text-white/40 font-black uppercase tracking-wider">
        <span>Start (GPS)</span>
        <span>End Route</span>
      </div>
    </div>
  );
}
