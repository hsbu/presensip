import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Alert } from '../types'

export function useAlerts(sessionId: string | null) {
  const [alert, setAlert] = useState<Alert | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const q = query(
      collection(db, 'alerts'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'desc'),
      limit(1)
    )
    return onSnapshot(q, (snap) => {
      setAlert(snap.docs.length > 0 ? (snap.docs[0].data() as Alert) : null)
    })
  }, [sessionId])

  return alert
}
