import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

interface Props {
  open: boolean
  onClose: () => void
}

function getInitials(email: string | null | undefined, displayName: string | null | undefined): string {
  if (displayName) {
    const parts = displayName.split(' ').filter(Boolean)
    return parts.slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return 'U'
}

export function DrawerNav({ open, onClose }: Props) {
  const { role, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!open) return null

  const go = (path: string) => { onClose(); navigate(path) }
  const handleSignOut = async () => { await signOut(auth); navigate('/login') }

  const isAdmin = role === 'admin'
  const initials = getInitials(user?.email, (user as any)?.displayName)
  const displayName = (user as any)?.displayName ?? (user?.email?.split('@')[0] ?? 'User')

  const avatarStyle: React.CSSProperties = isAdmin
    ? { background: 'rgba(91,141,238,0.12)', border: '2px solid rgba(91,141,238,0.30)', color: 'var(--blue)' }
    : { background: 'var(--neon-dim)', border: '2px solid var(--neon-glow)', color: 'var(--neon)' }

  return (
    <>
      <div
        data-testid="drawer-backdrop"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
      />
      <nav style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 270,
        background: 'var(--card)', borderRight: '1px solid var(--border2)',
        zIndex: 101, display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 20px', height: 64, borderBottom: '1px solid var(--border2)', flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/logo.png"
              alt="Presensip logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Presensip
          </span>
        </div>

        {/* Nav items */}
        <div style={{ padding: '12px 10px', flex: 1 }}>
          {role === 'lecturer' && (
            <NavItem
              label="Dashboard"
              active={location.pathname === '/lecturer/dashboard'}
              onClick={() => go('/lecturer/dashboard')}
            />
          )}
          {role === 'admin' && (
            <>
              <NavItem
                label="All Sessions"
                active={location.pathname === '/admin/dashboard'}
                onClick={() => go('/admin/dashboard')}
              />
              <NavItem
                label="Enrollments"
                active={location.pathname === '/admin/enrollments'}
                onClick={() => go('/admin/enrollments')}
              />
            </>
          )}
        </div>

        {/* User profile + sign out */}
        <div style={{ borderTop: '1px solid var(--border2)', padding: '16px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Barlow', sans-serif", fontSize: 11, fontWeight: 800,
              ...avatarStyle,
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', background: 'none', border: '1.5px solid var(--border2)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700,
              color: 'var(--red)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
              textAlign: 'center',
            }}
          >Sign Out</button>
        </div>
      </nav>
    </>
  )
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', background: active ? 'var(--card2)' : 'none',
        border: 'none', borderRadius: 10, textAlign: 'left',
        padding: '12px 14px', fontSize: 13, fontWeight: active ? 800 : 600,
        color: active ? 'var(--text)' : 'var(--sub)', cursor: 'pointer',
        fontFamily: "'Barlow', sans-serif", marginBottom: 2,
      }}
    >{label}</button>
  )
}
