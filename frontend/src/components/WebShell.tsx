import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
  title: string
  topbarRight?: ReactNode
}

const NAV: { label: string; icon: string; path: string; role: 'lecturer' | 'admin' | 'both' }[] = [
  { label: 'Dashboard',   icon: '◻', path: '/lecturer/dashboard',  role: 'lecturer' },
  { label: 'All Sessions', icon: '◈', path: '/admin/dashboard',     role: 'admin' },
  { label: 'Enrollments', icon: '◎', path: '/admin/enrollments',   role: 'admin' },
]

export function WebShell({ children, title, topbarRight }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role } = useAuth()

  const displayName = (user as any)?.displayName ?? (role === 'admin' ? 'Admin' : 'Lecturer')
  const email = user?.email ?? ''
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const navItems = NAV.filter(n => n.role === role || n.role === 'both')

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 228, flexShrink: 0,
        background: 'var(--card)',
        borderRight: '1.5px solid var(--border2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 20px', height: 64, flexShrink: 0,
          borderBottom: '1.5px solid var(--border2)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 0, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src="/logo.png"
              alt="Presensip logo"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: '-0.01em' }}>Presensip</div>
            <div style={{ fontSize: 10, color: 'var(--sub)', fontWeight: 600, marginTop: 1 }}>Attendance System</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          <div style={{
            fontSize: 9, fontWeight: 800, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '0.16em',
            padding: '12px 8px 6px',
          }}>
            {role === 'admin' ? 'Admin' : 'Lecturer'}
          </div>
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  userSelect: 'none',
                  color: active ? 'var(--neon)' : 'var(--sub)',
                  background: active ? 'var(--neon-dim)' : 'transparent',
                  border: active ? '1px solid var(--neon-glow)' : '1px solid transparent',
                  transition: 'background 0.13s, color 0.13s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    ;(e.currentTarget as HTMLDivElement).style.background = 'var(--card2)'
                    ;(e.currentTarget as HTMLDivElement).style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLDivElement).style.color = 'var(--sub)'
                  }
                }}
              >
                <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            )
          })}
        </nav>

        {/* Footer — user profile + sign out */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1.5px solid var(--border2)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: role === 'admin' ? 'var(--blue-dim)' : 'var(--neon-dim)',
              border: `1.5px solid ${role === 'admin' ? 'var(--blue-glow)' : 'var(--neon-glow)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
              fontSize: 12, color: role === 'admin' ? 'var(--blue)' : 'var(--neon)',
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                {email}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8, width: '100%',
              fontSize: 12, fontWeight: 700, color: 'var(--sub)',
              cursor: 'pointer', border: 'none', background: 'none',
              fontFamily: "'Barlow', sans-serif", transition: 'background 0.13s, color 0.13s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--card2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--sub)'
            }}
          >
            → Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', height: 64, flexShrink: 0,
          borderBottom: '1.5px solid var(--border2)',
          background: 'var(--card)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {title}
          </span>
          {topbarRight && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {topbarRight}
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px 32px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
