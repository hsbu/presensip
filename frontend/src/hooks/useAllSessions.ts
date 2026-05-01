import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Session } from '../types'

export function useAllSessions() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const q = query(collection(db, 'sessions'), orderBy('startTime', 'desc'))
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => d.data() as Session))
    })
  }, [])

  return sessions
}
