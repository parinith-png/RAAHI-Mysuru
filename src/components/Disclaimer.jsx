export default function Disclaimer() {
  return (
    <div style={{
      padding: '10px 16px',
      background: 'rgba(234,179,8,0.06)',
      border: '1px solid rgba(234,179,8,0.15)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 11,
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
    }}>
      <span style={{ fontWeight: 600, color: '#eab308' }}>⚠️ Disclaimer: </span>
      RoadGuard provides safety guidance, not legal instructions. Always follow posted signs, traffic laws, and road conditions.
    </div>
  );
}
