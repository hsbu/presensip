import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AttendanceRecord } from '../types'

export function useAttendance(sessionId: string | null) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (!sessionId) return
    const q = query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    )
    return onSnapshot(q, (snap) => {
      setRecords(
        snap.docs
          .map((d) => d.data() as AttendanceRecord)
          .filter((r) => r.studentId !== 'UNKNOWN')
      )
    })
  }, [sessionId])

  return records
}
