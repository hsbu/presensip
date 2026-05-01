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
      const entries = Object.values(snap.val()) as { count: number; timestamp: number }[]
      setCount(entries[0]?.count ?? null)
    })
  }, [classroomId, sessionId])

  return count
}
