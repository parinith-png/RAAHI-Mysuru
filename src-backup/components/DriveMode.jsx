import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceAlerts } from '../hooks/useVoiceAlerts.js';
import { seedBlindSpots } from '../data/seedFlags.js';
import { seedAccidents } from '../data/seedAccidents.js';
import { scorePoint } from '../utils/riskEngine.js';
import { calculateCautiousSpeed } from '../utils/speedEngine.js';

// Demo route: Sayyaji Rao Road → Hunsur Road Junction → NH275
const DEMO_ROUTE = [
  { lat: 12.3050, lng: 76.6560 },
  { lat: 12.3055, lng: 76.6558 },
  { lat: 12.3062, lng: 76.6555 },
  { lat: 12.3070, lng: 76.6553 },
  { lat: 12.3078, lng: 76.6552 },
  { lat: 12.3085, lng: 76.6551 },
  { lat: 12.3092, lng: 76.6550 },
  { lat: 12.3098, lng: 76.6550 }, // Approaching Irwin Road Junction blind spot
  { lat: 12.3100, lng: 76.6550 }, // AT Irwin Road Junction blind spot
  { lat: 12.3105, lng: 76.6548 },
  { lat: 12.3112, lng: 76.6545 },
  { lat: 12.3120, lng: 76.6540 },
  { lat: 12.3128, lng: 76.6530 },
  { lat: 12.3135, lng: 76.6515 },
  { lat: 12.3140, lng: 76.6500 },
  { lat: 12.3142, lng: 76.6480 },
  { lat: 12.3145, lng: 76.6460 },
  { lat: 12.3147, lng: 76.6440 },
  { lat: 12.3148, lng: 76.6420 },
  { lat: 12.3149, lng: 76.6400 },
  { lat: 12.3150, lng: 76.6380 },
  { lat: 12.3150, lng: 76.6360 },
  { lat: 12.3150, lng: 76.6340 },
  { lat: 12.3150, lng: 76.6320 },
  { lat: 12.3150, lng: 76.6300 }, // Hunsur Road Ring Road Junction blind spot
  { lat: 12.3155, lng: 76.6305 },
  { lat: 12.3165, lng: 76.6320 },
  { lat: 12.3180, lng: 76.6350 },
  { lat: 12.3200, lng: 76.6400 },
  { lat: 12.3220, lng: 76.6450 },
  { lat: 12.3250, lng: 76.6520 },
  { lat: 12.3280, lng: 76.6580 },
  { lat: 12.3300, lng: 76.6620 },
  { lat: 12.3320, lng: 76.6680 },
  { lat: 12.3340, lng: 76.6750 },
  { lat: 12.3348, lng: 76.6795 }, // Approaching NH275 blind spot
  { lat: 12.3350, lng: 76.6800 }, // AT NH275 blind spot
  { lat: 12.3355, lng: 76.6810 },
  { lat: 12.3360, lng: 76.6820 },
];

export default function DriveMode({ active, route, flags, accidents, onEnd, onPositionUpdate }) {
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [nextSafetyPoint, setNextSafetyPoint] = useState(null);
  const [currentRisk, setCurrentRisk] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(null);
  const [alertLog, setAlertLog] = useState([]);
  const { alertForFlag, clearFlagAlert, speak } = useVoiceAlerts();
  const demoTimerRef = useRef(null);

  // Calculate distance to blind spots
  const distanceTo = (pos, target) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((target.lat - pos.lat) * Math.PI) / 180;
    const dLng = ((target.lng - pos.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos((pos.lat * Math.PI) / 180) * Math.cos((target.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Check geofences at current position
  const checkGeofences = useCallback((pos) => {
    // Check blind spots
    for (const bs of seedBlindSpots) {
      const dist = distanceTo(pos, bs);
      if (dist <= bs.radius) {
        const spoke = alertForFlag(`bs_${bs.name}`, `Blind spot ahead. ${bs.subtype}. Proceed with caution.`);
        if (spoke) {
          setAlertLog((prev) => [...prev, { type: 'blindspot', name: bs.name, time: new Date().toLocaleTimeString() }]);
        }
      } else if (dist > bs.radius * 1.5) {
        clearFlagAlert(`bs_${bs.name}`);
      }
    }

    // Check high-risk zones
    const risk = scorePoint(pos.lat, pos.lng, accidents && accidents.length > 0 ? accidents : seedAccidents, flags);
    setCurrentRisk(risk);
    if (risk.score >= 60) {
      const spoke = alertForFlag(`risk_${Math.round(pos.lat * 100)}_${Math.round(pos.lng * 100)}`,
        `High-risk road segment ahead. Risk score: ${risk.score}. Proceed with caution.`);
      if (spoke) {
        setAlertLog((prev) => [...prev, { type: 'highrisk', score: risk.score, time: new Date().toLocaleTimeString() }]);
      }
    }

    // Speed guidance
    const speed = calculateCautiousSpeed(pos.lat, pos.lng, risk.score);
    setCurrentSpeed(speed);

    // Find next safety point
    let closestDist = Infinity;
    let closestPoint = null;
    for (const bs of seedBlindSpots) {
      const dist = distanceTo(pos, bs);
      if (dist < closestDist && dist > 50) { // Only upcoming points
        closestDist = dist;
        closestPoint = { name: bs.name, distance: Math.round(dist) };
      }
    }
    setNextSafetyPoint(closestPoint);
  }, [alertForFlag, clearFlagAlert, flags]);

  // Demo simulation
  const startDemo = () => {
    setDemoRunning(true);
    setDemoIdx(0);
    setAlertLog([]);
    speak('Demo simulation started. Driving along Mysuru route.');
  };

  useEffect(() => {
    if (!demoRunning) return;

    if (demoIdx >= DEMO_ROUTE.length) {
      setDemoRunning(false);
      speak('Demo simulation complete.');
      return;
    }

    demoTimerRef.current = setTimeout(() => {
      const pos = DEMO_ROUTE[demoIdx];
      setCurrentPosition(pos);
      checkGeofences(pos);
      if (onPositionUpdate) onPositionUpdate(pos);
      setDemoIdx((prev) => prev + 1);
    }, 1200); // Move every 1.2 seconds

    return () => clearTimeout(demoTimerRef.current);
  }, [demoRunning, demoIdx, checkGeofences]);

  const stopDemo = () => {
    setDemoRunning(false);
    clearTimeout(demoTimerRef.current);
  };

  if (!active) return null;

  return (
    <div className="drive-mode">
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: demoRunning ? '#22c55e' : '#eab308',
            boxShadow: demoRunning ? '0 0 12px rgba(34,197,94,0.5)' : 'none',
          }} />
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {demoRunning ? 'SAFE DRIVE MODE' : 'DRIVE MODE READY'}
          </div>
        </div>

        <button onClick={() => { stopDemo(); onEnd(); }} style={{
          padding: '8px 16px', background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)',
          color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>
          End Journey
        </button>
      </div>

      {/* Center content */}
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        {/* Shield icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: currentRisk?.score >= 60
            ? 'rgba(239,68,68,0.15)'
            : currentRisk?.score >= 30
              ? 'rgba(234,179,8,0.15)'
              : 'rgba(34,197,94,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          border: `2px solid ${currentRisk?.color || '#22c55e'}`,
          transition: 'all 0.5s',
        }}>
          <span style={{ fontSize: 36 }}>🛡️</span>
        </div>

        {/* Risk score */}
        {currentRisk && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 48, fontWeight: 800, lineHeight: 1,
              color: currentRisk.color,
            }}>
              {currentRisk.score}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              /100 CURRENT RISK · {currentRisk.label}
            </div>
          </div>
        )}

        {/* Speed guidance */}
        {currentSpeed && currentSpeed.cautiousSpeed && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>LEGAL</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{currentSpeed.legalLimit || '—'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>km/h</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CAUTIOUS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{currentSpeed.cautiousSpeed}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>km/h</div>
            </div>
          </div>
        )}

        {/* Next safety point */}
        {nextSafetyPoint && (
          <div style={{
            padding: '10px 16px', background: 'rgba(255,255,255,0.04)',
            borderRadius: 'var(--radius-sm)', marginBottom: 16,
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Next safety point</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              {nextSafetyPoint.name} · {nextSafetyPoint.distance}m
            </div>
          </div>
        )}

        {/* Route status */}
        <div style={{
          fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20,
        }}>
          {demoRunning
            ? `Route active · Simulating position ${demoIdx}/${DEMO_ROUTE.length}`
            : 'Ready to start'}
        </div>

        {/* Demo control */}
        {!demoRunning && (
          <button className="btn-primary" onClick={startDemo} style={{ padding: '14px 32px', fontSize: 15 }}>
            ▶ Start Demo Simulation
          </button>
        )}

        {demoRunning && (
          <button className="btn-secondary" onClick={stopDemo} style={{ padding: '10px 24px' }}>
            ⏸ Pause Demo
          </button>
        )}
      </div>

      {/* Alert log */}
      {alertLog.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16, right: 16,
          maxHeight: 120, overflowY: 'auto',
        }}>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600,
          }}>
            Alert Log
          </div>
          {alertLog.slice(-5).reverse().map((a, i) => (
            <div key={i} style={{
              fontSize: 11, color: 'var(--text-secondary)', padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ color: a.type === 'blindspot' ? '#8b5cf6' : '#ef4444' }}>
                {a.type === 'blindspot' ? '👁️' : '⚠️'}
              </span>
              {' '}{a.name || `Risk ${a.score}`} · {a.time}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        position: 'absolute', bottom: alertLog.length > 0 ? 140 : 16,
        left: 16, right: 16, textAlign: 'center',
        fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic',
      }}>
        RoadGuard provides safety guidance, not legal instructions. Always follow posted signs, traffic laws, and road conditions.
      </div>
    </div>
  );
}
