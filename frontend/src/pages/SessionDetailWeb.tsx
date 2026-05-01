import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, remove } from 'firebase/database'
import { db, rtdb } from '../lib/firebase'
import { useSession } from '../hooks/useSession'
import { useAttendance } from '../hooks/useAttendance'
import { useHeadCount } from '../hooks/useHeadCount'
import { useAlerts } from '../hooks/useAlerts'
import { useAuth } from '../hooks/useAuth'
import { WebShell } from '../components/WebShell'
import type { AttendanceRecord } from '../types'

interface Props {
  readonly?: boolean
}

export function SessionDetailWeb({ readonly = false }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const session = useSession(id ?? null)
  const attendance = useAttendance(id ?? null)
  const headCount = useHeadCount(session?.classroomId ?? null, id ?? null)
  const alert = useAlerts(id ?? null)

  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const elapsed = useElapsed(session?.startTime ?? 0, session?.status === 'active')

  const handleEnd = async () => {
    if (!session) return
    setEnding(true)
    setEndError(null)
    try {
      await updateDoc(doc(db, 'sessions', session.sessionId), {
        status: 'closed',
        endTime: Date.now(),
      })
      try {
        await remove(ref(rtdb, `classrooms/${session.classroomId}/activeSession`))
      } catch {
        setEndError('Session ended but classroom sensor not notified')
        setEnding(false)
        return
      }
      navigate('/lecturer/dashboard')
    } catch {
      setEndError('Failed to end session. Please try again.')
      setEnding(false)
    }
  }

  if (!session) return null

  const isLive = session.status === 'active'
  const backPath = role === 'admin' ? '/admin/dashboard' : '/lecturer/dashboard'

  const topbarLeft = (
    <span
      onClick={() => navigate(backPath)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--sub)', fontSize: 13 }}
    >
      ← <span style={{ fontWeight: 800, color: 'var(--text)' }}>{session.courseCode} · Session</span>
    </span>
  )

  const topbarRight = !readonly && isLive ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {isLive && <Chip variant="live">Live</Chip>}
      {endError && <span style={{ fontSize: 12, color: 'var(--amber)' }}>{endError}</span>}
      <button onClick={handleEnd} disabled={ending} style={btnRed}>
        {ending ? 'Ending…' : 'End Session'}
      </button>
    </div>
  ) : isLive ? <Chip variant="live">Live</Chip> : null

  return (
    <WebShell title={`${session.courseCode} · ${session.classroomId}`} topbarRight={topbarRight}>
      {/* Override topbar title with back navigation — inject via topbarRight hack using full width */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer', color: 'var(--sub)', fontSize: 13 }}
        onClick={() => navigate(backPath)}>
        ← <span style={{ fontWeight: 700 }}>Back to Dashboard</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live bar */}
          {isLive && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--neon-dim)', border: '2px solid var(--neon-glow)',
              borderRadius: 10, padding: '10px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LiveDot />
                <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--neon)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live</span>
              </div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: 'var(--sub)', letterSpacing: '0.06em' }}>
                {elapsed}
              </span>
            </div>
          )}

          {/* Count boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <CountBox value={session.presentCount} label="Biometric" neonColor="var(--neon)" dimColor="var(--neon-dim)" glowColor="var(--neon-glow)" />
            <CountBox value={headCount} label="Head Count" neonColor="var(--amber)" dimColor="var(--amber-dim)" glowColor="var(--amber-glow)" />
          </div>

          {/* Alert banner */}
          {alert && (
            <div style={{
              background: 'var(--amber-dim)', border: '2px solid var(--amber-glow)',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--amber)', marginBottom: 3 }}>Mismatch Detected</div>
                <div style={{ fontSize: 12, color: 'var(--amber)', opacity: 0.85, lineHeight: 1.4 }}>
                  {Math.abs(alert.biometricCount - alert.physicalCount)} unrecognized {Math.abs(alert.biometricCount - alert.physicalCount) === 1 ? 'person' : 'people'} in room.
                  Head count ({alert.physicalCount}) vs biometric ({alert.biometricCount}) — delta {Math.round(alert.delta * 100)}%.
                </div>
              </div>
            </div>
          )}

          {/* Session info */}
          <div style={card}>
            <div style={{ ...secLbl, marginBottom: 14 }}>Session Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <MetaItem k="Course" v={session.courseCode} />
              <MetaItem k="Room" v={session.classroomId} />
              <MetaItem k="Started" v={fmtTime(session.startTime)} />
              <MetaItem k="Interval" v={`${session.headCountIntervalMinutes} min`} />
              <MetaItem k="Status" v={session.status === 'active' ? 'Live' : 'Closed'} highlight={session.status === 'active'} />
              {session.endTime && <MetaItem k="Ended" v={fmtTime(session.endTime)} />}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)' }}>Attendance Progress</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--neon)' }}>
                  {session.presentCount} biometric
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'var(--neon)', width: `${Math.min(100, headCount ? (session.presentCount / headCount) * 100 : 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...card, flex: 1 }}>
            <div style={{ ...secLbl, marginBottom: 14 }}>Biometric Check-ins</div>
            {attendance.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>No check-ins yet</p>
            ) : (
              [...attendance].reverse().map((r, i, arr) => (
                <CheckInRow key={r.studentId + r.timestamp} record={r} last={i === arr.length - 1} />
              ))
            )}
          </div>
        </div>
      </div>
    </WebShell>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CountBox({ value, label, neonColor, dimColor, glowColor }: {
  value: number | null; label: string; neonColor: string; dimColor: string; glowColor: string
}) {
  return (
    <div style={{ background: dimColor, border: `2px solid ${glowColor}`, borderRadius: 14, padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 52, lineHeight: 1, letterSpacing: '-0.04em', color: neonColor }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    </div>
  )
}

function CheckInRow({ record, last }: { record: AttendanceRecord; last: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--border2)' }}>
      <div style={{ paddingTop: 4, flexShrink: 0 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--neon)', boxShadow: '0 0 6px var(--neon-glow)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{record.studentId}</div>
        <div style={{ fontSize: 11, color: 'var(--sub)' }}>Face recognised · confidence {(record.confidence * 100).toFixed(0)}%</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 3, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {fmtTime(record.timestamp)}
      </div>
    </div>
  )
}

function MetaItem({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{k}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? 'var(--neon)' : 'var(--text)' }}>{v}</div>
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

function LiveDot() {
  return (
    <span style={{
      display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'var(--neon)',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  )
}

// ── Hooks / utils ──────────────────────────────────────────────────────────

function useElapsed(startTime: number, running: boolean) {
  const [elapsed, setElapsed] = useState(formatElapsed(Date.now() - startTime))
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed(formatElapsed(Date.now() - startTime)), 1000)
    return () => clearInterval(t)
  }, [startTime, running])
  return elapsed
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ── Styles ─────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 14, padding: '18px 20px',
}
const secLbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em',
} as React.CSSProperties
const btnRed: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--red-dim)', color: 'var(--red)',
  border: '1.5px solid var(--red-glow)',
  fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: 12,
  padding: '9px 16px', borderRadius: 11, cursor: 'pointer',
}
