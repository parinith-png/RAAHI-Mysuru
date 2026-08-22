import { useState } from 'react';
import { scoreRoute, getRiskTier, explainRisk } from '../utils/riskEngine.js';
import { seedAccidents } from '../data/seedAccidents.js';
import SpeedGuidance from './SpeedGuidance.jsx';

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
  const recommended = sorted[0];
  const alternatives = sorted.slice(1);

  const selectedRoute = sorted[selectedIdx] || recommended;

  const handleSelect = (idx) => {
    setSelectedIdx(idx);
    if (onSelectRoute) onSelectRoute(sorted[idx]);
  };

  return (
    <div className="bottom-sheet animate-slide-up" style={{ padding: '0 0 24px' }}>
      <div className="bottom-sheet-handle" />

      {/* Header */}
      <div style={{
        padding: '8px 20px 12px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Route Planning
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {destination?.name || 'Destination'}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 20, cursor: 'pointer', padding: 4,
        }}>✕</button>
      </div>

      {/* Route cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '50vh', overflowY: 'auto' }}>
        {sorted.map((route, idx) => {
          const isRecommended = idx === 0;
          const isSelected = idx === selectedIdx;
          const riskTier = route.risk;

          return (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1.5px solid rgba(255,255,255,0.15)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {isRecommended && (
                  <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                    ✓ RECOMMENDED
                  </span>
                )}
                <span className="badge" style={{
                  background: riskTier.score < 30 ? 'rgba(34,197,94,0.12)' :
                    riskTier.score < 60 ? 'rgba(234,179,8,0.12)' :
                      'rgba(239,68,68,0.12)',
                  color: riskTier.color,
                }}>
                  {riskTier.score < 50 ? 'LOWER RISK' : 'HIGHER RISK'}
                </span>
              </div>

              {/* Route info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {route.distance} · {route.duration}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    via {route.summary}
                  </div>
                </div>

                {/* Risk score */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800, lineHeight: 1,
                    color: riskTier.color,
                  }}>
                    {riskTier.score}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>/100 risk</div>
                </div>
              </div>

              {/* Risk factors */}
              <div style={{
                marginTop: 10, padding: '8px 10px',
                background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-xs)',
                fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>High-risk zones</span>
                  <span style={{ fontWeight: 600 }}>{riskTier.highRiskZones}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>Active hazards</span>
                  <span style={{ fontWeight: 600 }}>{riskTier.activeHazards}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {isRecommended
                    ? `Lower predicted road-safety risk based on available data. Avoids ${riskTier.highRiskZones} high-risk zone(s).`
                    : `Passes ${riskTier.highRiskZones} high-risk zone(s).`
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Route risk profile for selected route */}
      {selectedRoute && (
        <div style={{ padding: '12px 16px 0' }}>
          <RouteRiskProfile segments={selectedRoute.risk.segments} />
        </div>
      )}

      {/* Speed Guidance for selected route midpoint */}
      {selectedRoute && selectedRoute.legs && (
        <div style={{ padding: '8px 16px 0' }}>
          <SpeedGuidance
            lat={selectedRoute.legs[0].start_location.lat}
            lng={selectedRoute.legs[0].start_location.lng}
            riskScore={selectedRoute.risk.score}
          />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => onStartJourney && onStartJourney(selectedRoute)}>
          🛡️ Start Safe Journey
        </button>
        <button className="btn-secondary" onClick={() => setShowDetail(!showDetail)}>
          {showDetail ? 'Less' : 'Detail'}
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '12px 16px 0', fontSize: 10,
        color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center',
      }}>
        Predicted road-safety risk based on available historical and community data.
      </div>
    </div>
  );
}

// Horizontal route risk profile bar
function RouteRiskProfile({ segments }) {
  if (!segments || segments.length === 0) return null;

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600,
      }}>
        Route Risk Profile
      </div>
      <div style={{
        display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1,
      }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: seg.color,
              opacity: 0.8,
              transition: 'opacity 0.2s',
            }}
            title={`Risk: ${seg.score}/100 (${seg.label})`}
          />
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: 'var(--text-muted)', marginTop: 3,
      }}>
        <span>START</span>
        <span>END</span>
      </div>
    </div>
  );
}
