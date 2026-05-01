import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Enrollment } from '../types'

export function useEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)

  useEffect(() => {
    return onSnapshot(collection(db, 'enrollments'), (snap) => {
      setEnrollments(snap.docs.map((d) => d.data() as Enrollment))
    })
  }, [])

  return enrollments
}
