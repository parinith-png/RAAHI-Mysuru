import { calculateCautiousSpeed } from '../utils/speedEngine.js';
import { getRiskTier } from '../utils/riskEngine.js';

export default function SpeedGuidance({ lat, lng, riskScore, conditions = {} }) {
  const speed = calculateCautiousSpeed(lat, lng, riskScore, conditions);

  if (!speed) return null;

  const riskInfo = getRiskTier(riskScore);

  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600,
      }}>
        Speed Guidance
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        {/* Legal Limit */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>LEGAL LIMIT</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {speed.legalLimit ? `${speed.legalLimit}` : '—'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {speed.legalLimit ? 'km/h' : 'Unknown'}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 40, background: 'var(--glass-border)' }} />

        {/* Risk */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>RISK</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: riskInfo.color }}>
            {riskScore}/100
          </div>
          <div style={{ fontSize: 9, color: riskInfo.color }}>{riskInfo.label}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 40, background: 'var(--glass-border)' }} />

        {/* Cautious Speed */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>CAUTIOUS</div>
          <div style={{
            fontSize: 22, fontWeight: 800,
            color: speed.cautiousSpeed ? '#22c55e' : 'var(--text-muted)',
          }}>
            {speed.cautiousSpeed ? `${speed.cautiousSpeed}` : '—'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {speed.cautiousSpeed ? 'km/h' : 'N/A'}
          </div>
        </div>
      </div>

      {/* Reason */}
      {speed.reason && (
        <div style={{
          marginTop: 8, fontSize: 11, color: 'var(--text-secondary)',
          padding: '6px 8px', background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-xs)',
        }}>
          <span style={{ fontWeight: 600 }}>Reason: </span>{speed.reason}
        </div>
      )}

      {/* Road name */}
      {speed.roadName && speed.roadName !== 'Unknown road' && (
        <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
          {speed.roadName} · Confidence: {speed.confidence}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: 6, fontSize: 9, color: 'var(--text-muted)',
        fontStyle: 'italic', lineHeight: 1.3,
      }}>
        {speed.disclaimer || 'Not a legal speed-limit change. Follow posted signs and traffic laws.'}
      </div>
    </div>
  );
}
