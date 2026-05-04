import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Alert } from '../types'

export function useAlerts(sessionId: string | null) {
  const [alert, setAlert] = useState<Alert | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const q = query(
      collection(db, 'alerts'),
      where('sessionId', '==', sessionId)
    )
    return onSnapshot(q, (snap) => {
      if (snap.docs.length === 0) {
        setAlert(null)
        return
      }
      const rows = snap.docs.map((d) => d.data() as Alert)
      rows.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      setAlert(rows[0] ?? null)
    })
  }, [sessionId])

  return alert
}
