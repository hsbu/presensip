interface Props {
  value: string | number | null
  label: string
  color?: 'neon' | 'white'
}

export function StatCard({ value, label, color = 'white' }: Props) {
  const textColor = color === 'neon' ? 'var(--neon)' : 'var(--text)'
  return (
    <div style={{
      background: 'var(--card)', border: '2px solid var(--border2)',
      borderRadius: 14, padding: '14px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
        fontSize: 32, color: textColor, lineHeight: 1, letterSpacing: '-0.04em',
      }}>
        {value ?? '—'}
      </span>
      <span style={{
        fontSize: 10, color: 'var(--sub)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>{label}</span>
    </div>
  )
}
