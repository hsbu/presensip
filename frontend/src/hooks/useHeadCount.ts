import { useEffect, useState } from 'react'
import { ref, query, limitToLast, onValue } from 'firebase/database'
import { rtdb } from '../lib/firebase'

export function useHeadCount(classroomId: string | null, sessionId: string | null) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!classroomId || !sessionId) return
    const r = query(
      ref(rtdb, `classrooms/${classroomId}/sessions/${sessionId}/headCounts`),
      limitToLast(1)
    )
    return onValue(r, (snap) => {
      if (!snap.exists()) { setCount(null); return }
      const entries = Object.values(snap.val()) as Array<{ count?: number; detected_person_count?: number; timestamp?: number | string }>
      const latest = entries[0]
      setCount(latest?.count ?? latest?.detected_person_count ?? null)
    })
  }, [classroomId, sessionId])

  return count
}
