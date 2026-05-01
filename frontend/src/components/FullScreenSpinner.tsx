export function FullScreenSpinner() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: 'var(--neon)',
        animation: 'fspulse 1s ease-in-out infinite',
        boxShadow: '0 0 16px var(--neon-glow)',
      }} />
      <style>{`@keyframes fspulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }`}</style>
    </div>
  )
}
