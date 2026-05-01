import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: 32,
    }}>
      <p style={{ fontSize: 15, color: 'var(--sub)', textAlign: 'center' }}>
        You don't have permission to access this page.
      </p>
      <button
        onClick={async () => { await signOut(auth); navigate('/login') }}
        style={{
          background: 'var(--card2)', color: 'var(--text)', border: 'none',
          borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer',
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
