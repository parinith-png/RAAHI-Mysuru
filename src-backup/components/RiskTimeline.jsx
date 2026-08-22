import { temporalRisk } from '../utils/riskEngine.js';

const HOURS = [
  { label: '6 AM', hour: 6 },
  { label: '8 AM', hour: 8 },
  { label: '10 AM', hour: 10 },
  { label: '12 PM', hour: 12 },
  { label: '2 PM', hour: 14 },
  { label: '5 PM', hour: 17 },
  { label: '7 PM', hour: 19 },
  { label: '9 PM', hour: 21 },
  { label: '11 PM', hour: 23 },
];

function getRiskForHour(hour, baseRisk = 30) {
  let temporal;
  if (hour >= 17 && hour <= 20) temporal = 70;
  else if (hour >= 7 && hour <= 9) temporal = 50;
  else if (hour >= 21 || hour <= 5) temporal = 60;
  else temporal = 20;

  return Math.round(0.5 * baseRisk + 0.5 * temporal);
}

function getTierColor(score) {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 30) return '#eab308';
  return '#22c55e';
}

function getTierLabel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MODERATE';
  return 'LOW';
}

export default function RiskTimeline({ baseRisk = 30, visible = true }) {
  if (!visible) return null;

  const currentHour = new Date().getHours();

  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600,
      }}>
        Risk Timeline — When is this road riskier?
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
        {HOURS.map((h) => {
          const risk = getRiskForHour(h.hour, baseRisk);
          const height = Math.max(8, (risk / 100) * 52);
          const isCurrent = Math.abs(currentHour - h.hour) <= 1;

          return (
            <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div
                style={{
                  height: `${height}px`,
                  width: '100%',
                  borderRadius: '3px 3px 0 0',
                  background: getTierColor(risk),
                  opacity: isCurrent ? 1 : 0.6,
                  border: isCurrent ? '1.5px solid #fff' : 'none',
                  transition: 'all 0.3s',
                  position: 'relative',
                }}
                title={`${h.label}: ${getTierLabel(risk)} (${risk}/100)`}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
        {HOURS.map((h) => {
          const isCurrent = Math.abs(currentHour - h.hour) <= 1;
          return (
            <div key={h.hour} style={{
              flex: 1, textAlign: 'center',
              fontSize: 8, color: isCurrent ? '#fff' : 'var(--text-muted)',
              fontWeight: isCurrent ? 700 : 400,
            }}>
              {h.label}
            </div>
          );
        })}
      </div>

      {/* Current */}
      <div style={{
        marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center',
      }}>
        Current: <span style={{ fontWeight: 600, color: getTierColor(getRiskForHour(currentHour, baseRisk)) }}>
          {getTierLabel(getRiskForHour(currentHour, baseRisk))}
        </span> risk
      </div>
    </div>
  );
}
