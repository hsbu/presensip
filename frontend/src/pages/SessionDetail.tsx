import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, remove, get, limitToLast, query } from 'firebase/database'
import { db, rtdb } from '../lib/firebase'
import { useSession } from '../hooks/useSession'
import { useAttendance } from '../hooks/useAttendance'
import { useHeadCount } from '../hooks/useHeadCount'
import { useAlerts } from '../hooks/useAlerts'
import { AppShell } from '../components/AppShell'
import { LivePill } from '../components/LivePill'
import { CountBox } from '../components/CountBox'
import { AlertBanner } from '../components/AlertBanner'
import { AttendanceRow } from '../components/AttendanceRow'
import { Button } from '../components/Button'

interface Props {
  readonly?: boolean
}

export function SessionDetail({ readonly = false }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = useSession(id ?? null)
  const attendance = useAttendance(id ?? null)
  const headCount = useHeadCount(session?.classroomId ?? null, id ?? null)
  const alert = useAlerts(id ?? null)

  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const handleEnd = async () => {
    if (!session) return
    setEnding(true)
    setEndError(null)
    try {
      let latestHeadCount: number | null = headCount
      try {
        const headCountSnap = await get(
          query(ref(rtdb, `classrooms/${session.classroomId}/sessions/${session.sessionId}/headCounts`), limitToLast(1))
        )
        if (headCountSnap.exists()) {
          const rows = Object.values(headCountSnap.val()) as Array<{ count?: number; detected_person_count?: number }>
          const latest = rows[0]
          latestHeadCount = latest?.count ?? latest?.detected_person_count ?? latestHeadCount
        }
      } catch {
        // Fall back to the live hook value if the RTDB read fails.
      }

      await updateDoc(doc(db, 'sessions', session.sessionId), {
        status: 'closed',
        endTime: Date.now(),
        headCount: latestHeadCount ?? session.headCount ?? 0,
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

  return (
    <AppShell title={`${session.courseCode} · Session`} showBack>
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {session.status === 'active' && <LivePill startTime={session.startTime} />}

        <div style={{ display: 'flex', gap: 12 }}>
          <CountBox count={session.presentCount} label="Biometric" variant="neon" />
          <CountBox count={headCount} label="Head Count" variant="amber" />
        </div>

        {alert && <AlertBanner alert={alert} />}

        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--sub)', marginBottom: 8 }}>
            Attendance ({attendance.length})
          </p>
          {attendance.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              No records yet
            </p>
          )}
          {attendance.map(r => <AttendanceRow key={r.studentId} record={r} />)}
        </div>

        {!readonly && session.status === 'active' && (
          <div style={{ marginTop: 8 }}>
            {endError && <p style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 8 }}>{endError}</p>}
            <Button variant="red" onClick={handleEnd} loading={ending} fullWidth>End Session</Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
