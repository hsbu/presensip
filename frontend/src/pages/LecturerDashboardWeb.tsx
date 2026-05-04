import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, collection, setDoc, updateDoc } from 'firebase/firestore'
import { ref, set, remove } from 'firebase/database'
import { db, rtdb } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useSessionsByLecturer } from '../hooks/useSessionsByLecturer'
import { useHeadCount } from '../hooks/useHeadCount'
import { useAlerts } from '../hooks/useAlerts'
import { WebShell } from '../components/WebShell'
import type { Session } from '../types'


export function LecturerDashboardWeb() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const sessions = useSessionsByLecturer(user?.uid ?? null)

  const activeSession = sessions.find(s => s.status === 'active') ?? null
  const headCount = useHeadCount(activeSession?.classroomId ?? null, activeSession?.sessionId ?? null)
  const alert = useAlerts(activeSession?.sessionId ?? null)
  const computedAlert = useMemo(() => {
    if (!activeSession || headCount === null || headCount === activeSession.presentCount) return null
    return {
      sessionId: activeSession.sessionId,
      classroomId: activeSession.classroomId,
      biometricCount: activeSession.presentCount,
      physicalCount: headCount,
      delta: headCount === 0 ? 0 : Math.abs(headCount - activeSession.presentCount) / Math.max(headCount, activeSession.presentCount),
      timestamp: activeSession.startTime,
    }
  }, [activeSession, headCount])
  const effectiveAlert = alert ?? computedAlert

  const [modalOpen, setModalOpen] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [intervalMin] = useState(5)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }
  
  const handleEnd = async () => {
    if (!activeSession) return
    setEnding(true)
    setEndError(null)
    try {
      await updateDoc(doc(db, 'sessions', activeSession.sessionId), {
        status: 'closed',
        endTime: Date.now(),
      })
      try {
        await remove(ref(rtdb, `classrooms/${activeSession.classroomId}/activeSession`))
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

  const displayName = (user as any)?.displayName ?? 'Lecturer'
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const handleStart = async () => {
    if (!courseCode.trim() || !classroomId.trim()) return
    setStarting(true)
    setStartError(null)
    const sessionRef = doc(collection(db, 'sessions'))
    const sessionId = sessionRef.id
    const session = {
      sessionId,
      classroomId: classroomId.trim(),
      lecturerId: user!.uid,
      courseCode: courseCode.trim(),
      startTime: Date.now(),
      status: 'active' as const,
      headCountIntervalMinutes: intervalMin,
      presentCount: 0,
    }
    try {
      await setDoc(sessionRef, session)
      try {
        await set(ref(rtdb, `classrooms/${classroomId.trim()}/activeSession`), {
          sessionId,
          headCountIntervalMinutes: intervalMin,
        })
      } catch {
        setStartError('Session created but classroom sensor not notified')
        setStarting(false)
        return
      }
      setModalOpen(false)
      navigate(`/lecturer/sessions/${sessionId}`)
    } catch {
      setStartError('Failed to start session. Please try again.')
      setStarting(false)
    }
  }

  const mismatch = effectiveAlert ? Math.abs(effectiveAlert.biometricCount - effectiveAlert.physicalCount) : 0
  const recentSessionsMaxHeight = 8 * 44 + 36

  return (
    <WebShell
      title="Dashboard"
      topbarRight={
        <button onClick={() => setModalOpen(true)} style={btnNeon}>
          Start New Session
        </button>
      }
    >
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 6 }}>
          {greeting()},<br />{displayName}.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--sub)' }}>{dateStr}</p>
      </div>

      {/* Two-col: sessions table + active session/alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: recent sessions table */}
        <div style={card}>
          <div style={secHdr}>
            <span style={secLbl}>Recent Sessions</span>
          </div>
          {sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>No sessions yet</p>
          ) : (
            <div style={{ maxHeight: recentSessionsMaxHeight, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Course', 'Room', 'Date', 'Biometric', 'Head', 'Status'].map(h => (
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
                      headCount={s.sessionId === activeSession?.sessionId ? headCount : null}
                      onClick={() => navigate(`/lecturer/sessions/${s.sessionId}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: active session card + alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!activeSession ? (
            <InactiveSessionCard />
          ) : (
            <ActiveSessionCard
              session={activeSession}
              headCount={headCount}
              mismatch={mismatch}
              hasAlert={!!effectiveAlert}
              onViewDetail={() => navigate(`/lecturer/sessions/${activeSession.sessionId}`)}
                handleEnd={handleEnd}
                ending={ending}
                endError={endError}
            />
          )}

          <div style={{...card, height: 117}}>
            <div style={{ ...secLbl, marginBottom: 14 }}>Recent Alerts</div>
            {effectiveAlert ? (
              <TlItem
                dotColor="var(--amber)"
                title={`Mismatch · ${activeSession?.courseCode}`}
                sub={`Head count (${effectiveAlert.physicalCount}) vs biometric (${effectiveAlert.biometricCount}) — delta ${Math.round(effectiveAlert.delta * 100)}%`}
                time={fmtTime(effectiveAlert.timestamp)}
              />
            ) : (
              <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>No alerts for active session</p>
            )}
          </div>

        </div>
      </div>

      {/* New session modal */}
      {modalOpen && (
        <Modal onClose={() => { setModalOpen(false); setStartError(null) }}>
          <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 6 }}>New Session</h2>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 24 }}>Fill in the details to start tracking attendance.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Course Code">
              <input placeholder="e.g. CS101" value={courseCode} onChange={e => setCourseCode(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Classroom ID">
              <input placeholder="e.g. Room 302" value={classroomId} onChange={e => setClassroomId(e.target.value)} style={inputStyle} />
            </Field>
            {startError && (
              <p style={{ fontSize: 12, color: 'var(--amber)', padding: '10px 14px', background: 'var(--amber-dim)', borderRadius: 10, border: '1px solid var(--amber-glow)' }}>
                {startError}
              </p>
            )}
            <button
              onClick={handleStart}
              disabled={starting || !courseCode.trim() || !classroomId.trim()}
              style={{ ...btnNeon, width: '100%', justifyContent: 'center', opacity: (starting || !courseCode.trim() || !classroomId.trim()) ? 0.5 : 1 }}
            >
              {starting ? 'Starting…' : 'Start Session'}
            </button>
          </div>
        </Modal>
      )}
    </WebShell>
  )
}

// ── Active session card ────────────────────────────────────────────────────

function ActiveSessionCard({
  session, headCount, mismatch, hasAlert, onViewDetail, handleEnd, ending, endError,
}: {
  session: Session
  headCount: number | null
  mismatch: number
  hasAlert: boolean
  onViewDetail: () => void
  handleEnd: () => void
  ending: boolean
  endError: string | null
}) {
  const elapsed = useElapsed(session.startTime)

  return (
    <div style={{
      background: 'var(--card)', border: '2px solid var(--neon-glow)',
      borderRadius: 16, padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 3 }}>
            {session.courseCode}
          </div>
          <div style={{ fontSize: 11, color: 'var(--sub)' }}>
            {session.classroomId} · Started {fmtTime(session.startTime)} · {session.headCountIntervalMinutes} min interval
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onViewDetail} style={btnGhost}>View Detail
          </button>
          {endError && <span style={{ fontSize: 11, color: 'var(--amber)' }}>{endError}</span>}
          <button onClick={handleEnd} style={btnRed} disabled={ending}>
            {ending ? 'Ending…' : 'End Session'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 18 }}>
        <MiniStat value={session.presentCount} label="Biometric" color="var(--neon)" bg="transparent" />
        <MiniStat value={headCount ?? '0'} label="Head Count" color="var(--amber)" bg="transparent" />
        <MiniStat value={elapsed} label="Duration" color="var(--text)" bg="transparent" />
        <MiniStat value={mismatch} label="Mismatch" color={hasAlert ? 'var(--amber)' : 'var(--sub)'}
          bg={hasAlert ? 'var(--amber-dim)' : 'transparent'}
          borderColor={hasAlert ? 'var(--amber-glow)' : 'var(--border2)'}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)' }}>Biometric vs Head Count</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--neon)' }}>
            {session.presentCount} biometric · {headCount ?? ''} in room
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'var(--neon)', width: `${Math.min(100, headCount ? (session.presentCount / headCount) * 100 : 0)}%` }} />
        </div>
      </div>
    </div>
  )
}

function InactiveSessionCard() {
  const duration = formatElapsed(0)

  return (
    <div style={{
      background: 'var(--card)', border: '2px solid var(--border2)',
      borderRadius: 16, padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 3 }}>
            No active session
          </div>
          <div style={{ fontSize: 11, color: 'var(--sub)' }}>
            Start a session to begin tracking attendance
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ ...btnGhost, opacity: 0.5 }} disabled>View Detail</button>
          <button style={btnGray} disabled>End Session</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 18 }}>
        <MiniStat value={0} label="Biometric" color="var(--sub)" bg="transparent" />
        <MiniStat value={0} label="Head Count" color="var(--sub)" bg="transparent" />
        <MiniStat value={duration} label="Duration" color="var(--sub)" bg="transparent" />
        <MiniStat value={0} label="Mismatch" color="var(--sub)" bg="transparent" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)' }}>Biometric vs Head Count</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--sub)' }}>
            0 biometric · 0 in room
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'var(--border2)', width: '0%' }} />
        </div>
      </div>
    </div>
  )
}

// ── Session table row ──────────────────────────────────────────────────────

function SessionRow({ session, isActive, headCount, onClick }: {
  session: Session
  isActive: boolean
  headCount: number | null
  onClick: () => void
}) {
  const displayHeadCount = isActive ? headCount : (session.headCount ?? 0)
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
      <td style={tdStyle}>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{session.courseCode}</div>
      </td>
      <td style={{ ...tdStyle, color: 'var(--sub)', fontSize: 11 }}>{session.classroomId}</td>
      <td style={{ ...tdStyle, color: 'var(--sub)', fontSize: 11 }}>{fmtDate(session.startTime)}</td>
      <td style={tdStyle}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16 }}>
          {session.presentCount}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: isActive ? 'var(--amber)' : 'var(--text)' }}>
          {displayHeadCount !== null ? displayHeadCount : (isActive ? '—' : 0)}
        </span>
      </td>
      <td style={tdStyle}>{statusChip}</td>
    </tr>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────

function MiniStat({ value, label, color, bg, borderColor }: {
  value: string | number
  label: string
  color: string
  bg: string
  borderColor?: string
}) {
  return (
    <div style={{
      background: bg, border: `2px solid ${borderColor ?? 'var(--border2)'}`,
      borderRadius: 14, padding: '14px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 32, color, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {value}
      </span>
      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </span>
    </div>
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
      textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
      ...styles[variant],
    }}>
      {variant === 'live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', border: '2px solid var(--border2)',
          borderRadius: 20, padding: '28px 28px 24px', width: 420,
          maxWidth: '90vw',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Hooks / utils ──────────────────────────────────────────────────────────

function useElapsed(startTime: number) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(Date.now() - startTime))
  useEffect(() => {
    const t = setInterval(() => setElapsed(formatElapsed(Date.now() - startTime)), 1000)
    return () => clearInterval(t)
  }, [startTime])
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
const secLbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em' } as React.CSSProperties
const thStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.12em', padding: '0 12px 10px', textAlign: 'left',
  borderBottom: '1.5px solid var(--border2)',
}
const tdStyle: React.CSSProperties = {
  fontSize: 12, padding: '11px 12px', borderBottom: '1px solid var(--border2)',
  color: 'var(--text)', verticalAlign: 'middle',
}
const btnNeon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'var(--neon)', color: '#0e0e0e',
  fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: 13,
  padding: '11px 22px', borderRadius: 11, border: 'none', cursor: 'pointer', letterSpacing: '0.01em',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'transparent', color: 'var(--sub)',
  border: '1.5px solid var(--border2)',
  fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 10,
  padding: '9px 16px', borderRadius: 16, cursor: 'pointer',
}
const btnRed: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--red-dim)', color: 'var(--red)',
  border: '1.5px solid var(--red-glow)',
  fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: 10,
  padding: '9px 16px', borderRadius: 16, cursor: 'pointer',
}
const btnGray: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'rgba(255,255,255,.04)', color: 'var(--sub)',
  border: '1.5px solid var(--border2)',
  fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: 10,
  padding: '9px 16px', borderRadius: 16, cursor: 'not-allowed',
}
const inputStyle: React.CSSProperties = {
  background: 'var(--card2)', border: '2px solid var(--border2)',
  borderRadius: 12, padding: '13px 14px', fontSize: 14,
  color: 'var(--text)', outline: 'none', width: '100%',
}
