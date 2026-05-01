import { useEffect, useState } from 'react'

function elapsed(startTime: number) {
  const diff = Math.max(0, Date.now() - startTime)
  const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
  const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function LivePill({ startTime }: { startTime: number }) {
  const [time, setTime] = useState(() => elapsed(startTime))

  useEffect(() => {
    const id = setInterval(() => setTime(elapsed(startTime)), 1000)
    return () => clearInterval(id)
  }, [startTime])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--neon-dim)', border: '2px solid var(--neon-glow)',
      borderRadius: 10, padding: '10px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 9, height: 9, borderRadius: '50%', background: 'var(--neon)',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Barlow', sans-serif", fontWeight: 800,
          fontSize: 12, color: 'var(--neon)', letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>Live</span>
      </div>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
        fontSize: 12, color: 'var(--sub)', letterSpacing: '0.06em',
      }}>{time}</span>
    </div>
  )
}
