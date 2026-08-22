export default function MapLegend({ visible = true, mapMode = 'mysuru' }) {
  if (!visible) return null;

  return (
    <div className="glass-card animate-fade-in-up" style={{
      position: 'absolute', bottom: 16, left: 16, zIndex: 10,
      padding: '12px 14px', fontSize: 11, minWidth: 180,
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        Safety Legend
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <LegendRow 
          color="linear-gradient(90deg, #ffc800, #ff5000, #c80000)" 
          label={mapMode === 'karnataka' ? 'Statewide cell risk index' : 'Historical accident risk'} 
          type="gradient" 
        />
        <LegendRow color="#eab308" label="Live community warning" />
        <LegendRow color="#f97316" label="Confirmed hazard" />
        <LegendRow color="#ef4444" label="High-confidence hazard" />
        <LegendRow color="#8b5cf6" label="Blind spot zone" />
        <LegendRow color="#3b82f6" label="Your location" />
      </div>

      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
        Historical accident/risk database · Not an ML prediction
      </div>
    </div>
  );
}

function LegendRow({ color, label, type }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {type === 'gradient' ? (
        <div style={{
          width: 28, height: 6, borderRadius: 3,
          background: color, flexShrink: 0,
        }} />
      ) : (
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color, flexShrink: 0,
          border: '1.5px solid rgba(255,255,255,0.3)',
        }} />
      )}
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}
