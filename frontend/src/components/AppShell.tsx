import { useState } from 'react'
import type { ReactNode } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { DrawerNav } from './DrawerNav'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
  title?: string
  showBack?: boolean
}

function getInitials(email: string | null | undefined, displayName: string | null | undefined): string {
  if (displayName) {
    const parts = displayName.split(' ').filter(Boolean)
    return parts.slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return 'U'
}

export function AppShell({ children, title, showBack }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { role, user } = useAuth()
  const navigate = useNavigate()

  const isAdmin = role === 'admin'
  const initials = getInitials(user?.email, (user as any)?.displayName)

  const avatarStyle: React.CSSProperties = isAdmin
    ? {
        background: 'rgba(91,141,238,0.12)', border: '2px solid rgba(91,141,238,0.30)',
        color: 'var(--blue)',
      }
    : {
        background: 'var(--neon-dim)', border: '2px solid var(--neon-glow)',
        color: 'var(--neon)',
      }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      {!showBack && <DrawerNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 0', minHeight: 52,
      }}>
        {showBack ? (
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
              padding: 4, fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center',
            }}
          >←</button>
        ) : (
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 5, padding: 4,
            }}
          >
            <span style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: 'var(--sub)' }} />
            <span style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: 'var(--sub)' }} />
            <span style={{ display: 'block', width: 14, height: 2, borderRadius: 2, background: 'var(--sub)' }} />
          </button>
        )}
        {title && (
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</span>
        )}
        {showBack ? (
          <div style={{ width: 30 }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 800,
            ...avatarStyle,
          }}>{initials}</div>
        )}
      </header>
      <main style={{ padding: '0 20px 32px' }}>
        {children}
      </main>
    </div>
  )
}
