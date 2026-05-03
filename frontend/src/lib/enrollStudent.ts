import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

interface EnrollStudentInput {
  studentId: string
  studentName: string
  images: string[]
  enrolledBy: string
  enrollFaceUrl?: string
}

export async function enrollStudent(input: EnrollStudentInput) {
  const studentId = input.studentId.trim()
  const studentName = input.studentName.trim()

  if (!studentId || !studentName) {
    throw new Error('Student name and NIM are required.')
  }

  if (input.enrollFaceUrl) {
    const res = await fetch(input.enrollFaceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, studentName, images: input.images }),
    })

    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      return
    }
  }

  // Fallback path: direct Firestore enrollment for dashboard/demo workflow.
  await setDoc(doc(db, 'enrollments', studentId), {
    studentId,
    studentName,
    embedding: [],
    enrolledAt: Date.now(),
    enrolledBy: input.enrolledBy,
  }, { merge: true })
}
