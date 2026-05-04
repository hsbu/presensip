import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAppUsers(): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const map: Record<string, string> = {}
      snap.forEach(d => {
        const data = d.data()
        map[d.id] = data.displayName ?? data.email ?? d.id.slice(0, 8)
      })
      setNames(map)
    })
    return unsub
  }, [])

  return names
}
