import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Session } from '../types'

export function useSessionsByLecturer(lecturerId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    if (!lecturerId) return
    const q = query(
      collection(db, 'sessions'),
      where('lecturerId', '==', lecturerId)
    )
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => d.data() as Session)
      rows.sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0))
      setSessions(rows)
    })
  }, [lecturerId])

  return sessions
}
