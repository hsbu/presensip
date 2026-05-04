import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, collection, setDoc } from 'firebase/firestore'
import { ref, set } from 'firebase/database'
import { db, rtdb } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useSessionsByLecturer } from '../hooks/useSessionsByLecturer'
import { AppShell } from '../components/AppShell'
import { SessionCard } from '../components/SessionCard'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/BottomSheet'

export function LecturerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const sessions = useSessionsByLecturer(user?.uid ?? null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [intervalMin] = useState(5)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const activeSession = sessions.find(s => s.status === 'active')
  const activeSessions = sessions.filter(s => s.status === 'active').length
  const totalPresent = sessions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.presentCount ?? 0), 0)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
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
      setSheetOpen(false)
      navigate(`/lecturer/sessions/${sessionId}`)
    } catch {
      setStartError('Failed to start session. Please try again.')
      setStarting(false)
    }
  }

  return (
    <AppShell>
      {/* Greeting */}
      <div style={{ paddingTop: 20, marginBottom: 24 }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          color: 'var(--text)',
          marginBottom: 6,
        }}>
          {greeting()},<br />{displayName}.
        </h1>
        <p style={{ fontSize: 12, color: 'var(--sub)', letterSpacing: '0.01em' }}>
          {dateStr}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        <StatBlock value={activeSessions} label="Active Session" accent="neon" />
        <StatBlock value={activeSession?.presentCount ?? totalPresent} label="Present Today" accent="white" />
      </div>

      {/* Section header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: 'var(--sub)',
          textTransform: 'uppercase', letterSpacing: '0.14em',
        }}>Recent Sessions</span>
      </div>

      {/* Session list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {sessions.map(s => (
          <SessionCard
            key={s.sessionId}
            session={s}
            headCount={null}
            onPress={() => navigate(`/lecturer/sessions/${s.sessionId}`)}
          />
        ))}
        {sessions.length === 0 && (
          <div style={{
            background: 'var(--card)', border: '2px solid var(--border2)',
            borderRadius: 14, padding: '32px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'var(--sub)' }}>No sessions yet</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Start a session to begin tracking attendance
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ marginBottom: 8 }}>
        <Button variant="neon" onClick={() => setSheetOpen(true)} fullWidth>
          Start New Session
        </Button>
      </div>

      {/* Bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setStartError(null) }}>
        <h2 style={{
          fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em',
          marginBottom: 6, color: 'var(--text)',
        }}>New Session</h2>
        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 24 }}>
          Fill in the details to start tracking attendance.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Course Code">
            <input
              placeholder="e.g. CS101"
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Classroom ID">
            <input
              placeholder="e.g. Room 302"
              value={classroomId}
              onChange={e => setClassroomId(e.target.value)}
              style={inputStyle}
            />
          </Field>
          {startError && (
            <p style={{ fontSize: 12, color: 'var(--amber)', padding: '10px 14px', background: 'var(--amber-dim)', borderRadius: 10, border: '1px solid var(--amber-glow)' }}>
              {startError}
            </p>
          )}
          <Button
            variant="neon"
            onClick={handleStart}
            loading={starting}
            disabled={!courseCode.trim() || !classroomId.trim()}
            fullWidth
          >
            Start Session
          </Button>
        </div>
      </BottomSheet>
    </AppShell>
  )
}

// ── Inline sub-components ──────────────────────────────────────────────────

function StatBlock({ value, label, accent }: { value: number; label: string; accent: 'neon' | 'white' }) {
  const valueColor = accent === 'neon' ? 'var(--neon)' : 'var(--text)'
  return (
    <div style={{
      background: 'var(--card)',
      border: '2px solid var(--border2)',
      borderRadius: 14,
      padding: '16px 16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: 36,
        color: valueColor,
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--sub)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        {label}
      </span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 10, fontWeight: 800, color: 'var(--sub)',
        textTransform: 'uppercase', letterSpacing: '0.14em',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--card2)',
  border: '2px solid var(--border2)',
  borderRadius: 12,
  padding: '13px 14px',
  fontSize: 14,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
}
