import { useNavigate } from 'react-router-dom'
import { useAllSessions } from '../hooks/useAllSessions'
import { useAppUsers } from '../hooks/useAppUsers'
import { AppShell } from '../components/AppShell'
import { StatCard } from '../components/StatCard'
import { SessionCard } from '../components/SessionCard'

export function AdminDashboard() {
  const navigate = useNavigate()
  const sessions = useAllSessions()
  const userNames = useAppUsers()
  const activeCount = sessions.filter(s => s.status === 'active').length

  return (
    <AppShell>
      <div style={{ paddingTop: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>Sessions</h1>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6 }}>
            {sessions.length} sessions total
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <StatCard value={sessions.length} label="Total Sessions" color="white" />
          <StatCard value={activeCount} label="Active Now" color="neon" />
        </div>

        <p style={{
          fontSize: 11, fontWeight: 800, color: 'var(--sub)',
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14,
        }}>
          All Sessions
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map(s => (
            <SessionCard
              key={s.sessionId}
              session={s}
              headCount={null}
              lecturerName={userNames[s.lecturerId]}
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
