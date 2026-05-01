import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Session } from '../types'

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!sessionId) return
    return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      setSession(snap.exists() ? (snap.data() as Session) : null)
    })
  }, [sessionId])

  return session
}
