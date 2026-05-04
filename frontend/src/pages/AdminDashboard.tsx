import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, collection, setDoc } from 'firebase/firestore'
import { ref, set } from 'firebase/database'
import { db, rtdb } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useAllSessions } from '../hooks/useAllSessions'
import { useAppUsers } from '../hooks/useAppUsers'
import { AppShell } from '../components/AppShell'
import { StatCard } from '../components/StatCard'
import { SessionCard } from '../components/SessionCard'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/BottomSheet'

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const sessions = useAllSessions()
  const userNames = useAppUsers()
  const activeCount = sessions.filter(s => s.status === 'active').length

  const [sheetOpen, setSheetOpen] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [intervalMin, setIntervalMin] = useState(5)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

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
      setCourseCode(''); setClassroomId(''); setIntervalMin(5)
      navigate(`/admin/sessions/${sessionId}`)
    } catch {
      setStartError('Failed to start session. Please try again.')
      setStarting(false)
    }
  }

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

        <div style={{ marginBottom: 24 }}>
          <Button variant="neon" onClick={() => setSheetOpen(true)} fullWidth>
            Start New Session
          </Button>
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

      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setStartError(null) }}>
        <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text)' }}>
          New Session
        </h2>
        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 24 }}>
          Fill in the details to start tracking attendance.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Course Code">
            <input placeholder="e.g. CS101" value={courseCode} onChange={e => setCourseCode(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Classroom ID">
            <input placeholder="e.g. Room 302" value={classroomId} onChange={e => setClassroomId(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Head Count Interval (minutes)">
            <input type="number" min={1} value={intervalMin} onChange={e => setIntervalMin(Number(e.target.value))} style={inputStyle} />
          </Field>
          {startError && (
            <p style={{ fontSize: 12, color: 'var(--amber)', padding: '10px 14px', background: 'var(--amber-dim)', borderRadius: 10, border: '1px solid var(--amber-glow)' }}>
              {startError}
            </p>
          )}
          <Button variant="neon" onClick={handleStart} loading={starting} disabled={!courseCode.trim() || !classroomId.trim()} fullWidth>
            Start Session
          </Button>
        </div>
      </BottomSheet>
    </AppShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--card2)', border: '2px solid var(--border2)', borderRadius: 12,
  padding: '13px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%',
}
