import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllSessions } from '../hooks/useAllSessions'
import { useAlerts } from '../hooks/useAlerts'
import { useHeadCount } from '../hooks/useHeadCount'
import { WebShell } from '../components/WebShell'
import type { Session } from '../types'

export function AdminDashboardWeb() {
  const navigate = useNavigate()
  const sessions = useAllSessions()

  const activeSession = sessions.find(s => s.status === 'active') ?? null
  const activeCount = sessions.filter(s => s.status === 'active').length
  const alertCount = sessions.filter(s => s.status === 'pending_verification').length
  const closedCount = sessions.filter(s => s.status === 'closed').length

  const headCount = useHeadCount(activeSession?.classroomId ?? null, activeSession?.sessionId ?? null)
  const alert = useAlerts(activeSession?.sessionId ?? null)

  return (
    <WebShell
      title="All Sessions"
      topbarRight={
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          {sessions.length} sessions · {activeCount} active
        </span>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard value={sessions.length} label="Total" color="var(--text)" />
            <StatCard value={activeCount} label="Active Now" color="var(--neon)" />
            <StatCard value={alertCount} label="Alerts" color="var(--amber)" />
            <StatCard value={closedCount} label="Closed" color="var(--sub)" />
          </div>

          {/* Sessions table */}
          <div style={card}>
            <div style={secHdr}>
              <span style={secLbl}>All Sessions</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Chip variant="live">Live</Chip>
                <Chip variant="closed">All</Chip>
              </div>
            </div>
            {sessions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>No sessions yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Course', 'Lecturer', 'Room', 'Date', 'Biometric', 'Head', 'Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <SessionRow
                      key={s.sessionId}
                      session={s}
                      isActive={s.sessionId === activeSession?.sessionId}
                      activeHeadCount={s.sessionId === activeSession?.sessionId ? headCount : null}
                      onClick={() => navigate(`/admin/sessions/${s.sessionId}`)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Active session snapshot */}
          {activeSession ? (
            <div style={{ ...card, borderColor: 'var(--neon-glow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <span style={secLbl}>Active Session</span>
                  <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 5 }}>{activeSession.courseCode}</div>
                  <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>
                    {activeSession.classroomId} · Started {fmtTime(activeSession.startTime)}
                  </div>
                </div>
                <Chip variant="live">Live</Chip>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <CountBox value={activeSession.presentCount} label="Biometric" neonColor="var(--neon)" dimColor="var(--neon-dim)" glowColor="var(--neon-glow)" />
                <CountBox value={headCount} label="Head Count" neonColor="var(--amber)" dimColor="var(--amber-dim)" glowColor="var(--amber-glow)" />
              </div>
              {alert && (
                <div style={{
                  background: 'var(--amber-dim)', border: '2px solid var(--amber-glow)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--amber)', marginBottom: 2 }}>Mismatch Detected</div>
                    <div style={{ fontSize: 11, color: 'var(--amber)', opacity: 0.85 }}>
                      Head count ({alert.physicalCount}) vs biometric ({alert.biometricCount}) — delta {Math.round(alert.delta * 100)}%
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)' }}>Attendance Rate</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--neon)' }}>
                    {activeSession.presentCount} of {headCount ?? '?'}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--neon)', width: `${Math.min(100, headCount ? (activeSession.presentCount / headCount) * 100 : 0)}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card, textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ fontSize: 13, color: 'var(--sub)' }}>No active session</p>
            </div>
          )}

          {/* Alert feed */}
          <div style={{ ...card, flex: 1 }}>
            <div style={{ ...secLbl, marginBottom: 14 }}>Alert Feed</div>
            {alert ? (
              <>
                <TlItem
                  dotColor="var(--amber)"
                  title={`Mismatch · ${activeSession?.courseCode}`}
                  sub={`Head count (${alert.physicalCount}) vs biometric (${alert.biometricCount}) — delta ${Math.round(alert.delta * 100)}%`}
                  time={fmtTime(alert.timestamp)}
                />
                <TlItem
                  dotColor="var(--muted)"
                  title="Monitoring active"
                  sub="F03 pipeline running every interval"
                  time="—"
                  noBorder
                />
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>No alerts detected</p>
            )}
          </div>
        </div>
      </div>
    </WebShell>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 14, padding: '18px 18px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 38, lineHeight: 1, letterSpacing: '-0.04em', color }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </span>
    </div>
  )
}

function CountBox({ value, label, neonColor, dimColor, glowColor }: {
  value: number | null; label: string; neonColor: string; dimColor: string; glowColor: string
}) {
  return (
    <div style={{ background: dimColor, border: `1.5px solid ${glowColor}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 32, lineHeight: 1, letterSpacing: '-0.04em', color: neonColor }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    </div>
  )
}

function SessionRow({ session, isActive, activeHeadCount, onClick }: {
  session: Session; isActive: boolean; activeHeadCount: number | null; onClick: () => void
}) {
  const statusChip = session.status === 'active'
    ? <Chip variant="live">Live</Chip>
    : session.status === 'pending_verification'
      ? <Chip variant="alert">Alert</Chip>
      : <Chip variant="closed">Closed</Chip>

  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)'}
      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
    >
      <td style={tdStyle}><div style={{ fontWeight: 700, fontSize: 12 }}>{session.courseCode}</div></td>
      <td style={{ ...tdStyle, fontSize: 11, color: 'var(--sub)' }}>{session.lecturerId.slice(0, 8)}…</td>
      <td style={{ ...tdStyle, fontSize: 11, color: 'var(--sub)' }}>{session.classroomId}</td>
      <td style={{ ...tdStyle, fontSize: 11, color: 'var(--sub)' }}>{fmtDate(session.startTime)}</td>
      <td style={tdStyle}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16 }}>{session.presentCount}</span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: isActive ? 'var(--amber)' : 'var(--text)' }}>
          {isActive && activeHeadCount !== null ? activeHeadCount : '—'}
        </span>
      </td>
      <td style={tdStyle}>{statusChip}</td>
    </tr>
  )
}

function TlItem({ dotColor, title, sub, time, noBorder }: {
  dotColor: string; title: string; sub: string; time: string; noBorder?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: noBorder ? 'none' : '1px solid var(--border2)' }}>
      <div style={{ paddingTop: 4, flexShrink: 0 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--sub)' }}>{sub}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 3, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {time}
      </div>
    </div>
  )
}

function Chip({ variant, children }: { variant: 'live' | 'alert' | 'closed'; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    live: { color: 'var(--neon)', background: 'var(--neon-dim)', border: '1.5px solid var(--neon-glow)' },
    alert: { color: 'var(--amber)', background: 'var(--amber-dim)', border: '1.5px solid var(--amber-glow)' },
    closed: { color: 'var(--sub)', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border2)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: '0.08em', ...styles[variant],
    }}>
      {variant === 'live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  )
}

// ── Utils ──────────────────────────────────────────────────────────────────

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return `Today ${fmtTime(ts)}`
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${fmtTime(ts)}`
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Styles ─────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 14, padding: '18px 20px',
}
const secHdr: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }
const secLbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em',
} as React.CSSProperties
const thStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.12em', padding: '0 12px 10px', textAlign: 'left',
  borderBottom: '1.5px solid var(--border2)',
}
const tdStyle: React.CSSProperties = {
  fontSize: 12, padding: '11px 12px', borderBottom: '1px solid var(--border2)',
  color: 'var(--text)', verticalAlign: 'middle',
}
