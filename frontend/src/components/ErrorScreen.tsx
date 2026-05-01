interface Props {
  message: string
  onSignOut: () => void
}

export function ErrorScreen({ message, onSignOut }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 24, padding: 32,
    }}>
      <p style={{ color: 'var(--sub)', textAlign: 'center', fontSize: 15 }}>{message}</p>
      <button
        onClick={onSignOut}
        style={{
          background: 'var(--red)', color: '#fff', border: 'none',
          borderRadius: 14, padding: '16px 32px', fontSize: 15,
          fontWeight: 800, cursor: 'pointer',
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
