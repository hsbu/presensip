import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Session } from '../types'

export function useSessionsByLecturer(lecturerId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    if (!lecturerId) return
    const q = query(
      collection(db, 'sessions'),
      where('lecturerId', '==', lecturerId),
      orderBy('startTime', 'desc')
    )
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => d.data() as Session))
    })
  }, [lecturerId])

  return sessions
}
