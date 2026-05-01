interface Props {
  count: number | null
  label: string
  variant: 'neon' | 'amber'
}

export function CountBox({ count, label, variant }: Props) {
  const color = variant === 'neon' ? 'var(--neon)' : 'var(--amber)'
  const bg = variant === 'neon' ? 'var(--neon-dim)' : 'var(--amber-dim)'
  const border = variant === 'neon' ? 'var(--neon-glow)' : 'var(--amber-glow)'
  return (
    <div style={{
      flex: 1, background: bg, border: `2px solid ${border}`,
      borderRadius: 14, padding: '16px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
        fontSize: 52, color, lineHeight: 1, letterSpacing: '-0.04em',
      }}>
        {count ?? '—'}
      </span>
      <span style={{
        fontSize: 10, color: 'var(--sub)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>{label}</span>
    </div>
  )
}
