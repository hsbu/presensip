   import { useNavigate } from 'react-router-dom'
import { useAllSessions } from '../hooks/useAllSessions'
import { AppShell } from '../components/AppShell'
import { StatCard } from '../components/StatCard'
import { SessionCard } from '../components/SessionCard'
import React, { useEffect, useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

export function AdminDashboard() {
  const navigate = useNavigate()
  const sessions = useAllSessions()
  const activeCount = sessions.filter(s => s.status === 'active').length
  const isMobile = useIsMobile()

  // Render the full web dashboard on non-mobile screens (matches provided design)
  const [WebComp, setWebComp] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    if (!isMobile) {
      import('./AdminDashboardWeb').then((m) => setWebComp(() => m.AdminDashboardWeb)).catch(() => {})
    }
  }, [isMobile])

  if (!isMobile && WebComp) return <WebComp />
  if (!isMobile && !WebComp) return null

  return (
    <AppShell>
      <div style={{ paddingTop: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>Sessions</h1>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6 }}>
            {sessions.length} sessions total
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          <StatCard value={sessions.length} label="Total Sessions" color="white" />
          <StatCard value={activeCount} label="Active Now" color="neon" />
        </div>

        {/* Section label */}
        <p style={{
          fontSize: 11, fontWeight: 800, color: 'var(--sub)',
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14,
        }}>
          All Sessions
        </p>

        {/* Session list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map(s => (
            <SessionCard
              key={s.sessionId}
              session={s}
              headCount={null}
              onPress={() => navigate(`/admin/sessions/${s.sessionId}`)}
            />
          ))}
          {sessions.length === 0 && (
            <div style={{
              background: 'var(--card)', border: '2px solid var(--border2)',
              borderRadius: 14, padding: '32px 20px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: 'var(--sub)' }}>No sessions yet</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
