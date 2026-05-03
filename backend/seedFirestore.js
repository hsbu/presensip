#!/usr/bin/env node
/**
 * Seed Firestore with dummy sessions (backend copy).
 * Usage:
 *  - Place your Firebase service account JSON next to this file or set SERVICE_ACCOUNT_PATH
 *  - Run: `npm run seed:firestore` inside the `backend` folder
 */
import fs from 'fs'
import path from 'path'
import process from 'process'
import admin from 'firebase-admin'

function loadServiceAccount() {
  if (process.env.SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
  }
  const p = process.env.SERVICE_ACCOUNT_PATH || './serviceAccount.json'
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p)
  if (!fs.existsSync(abs)) {
    console.error('ERROR: service account file not found at', abs)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'))
}

async function main() {
  const serviceAccount = loadServiceAccount()
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: serviceAccount.databaseURL,
  })
  const db = admin.firestore()
  const lecturerId = process.env.LECTURER_UID || 'lec-rahmat'
  const lecturerName = process.env.LECTURER_NAME || 'Dr. Rahmat'
  console.log(`Using lecturer seed identity: ${lecturerName} (${lecturerId})`)
  let rtdb = null
  try {
    rtdb = admin.database()
  } catch (e) {
    console.warn('Realtime Database error:', e.message)
  }

  const now = Date.now()
  const sessions = [
    {
      sessionId: 's-cs101',
      courseCode: 'CS101 – Algorithm Design',
      classroomId: 'Room 302',
      status: 'active',
      presentCount: 4,
      headCountIntervalMinutes: 5,
      lecturerId,
      startTime: now - 1000 * 60 * 30,
      createdAt: now,
    },
    {
      sessionId: 's-cs201',
      courseCode: 'CS201 – Data Structures',
      classroomId: 'Room 302',
      status: 'pending_verification',
      presentCount: 3,
      headCountIntervalMinutes: 5,
      lecturerId,
      startTime: now - 1000 * 60 * 60 * 24,
      createdAt: now - 1000 * 60 * 60 * 24,
    },
    {
      sessionId: 's-cs301',
      courseCode: 'CS301 – Networks',
      classroomId: 'Room 302',
      status: 'closed',
      presentCount: 25,
      headCountIntervalMinutes: 10,
      lecturerId,
      startTime: now - 1000 * 60 * 60 * 48,
      createdAt: now - 1000 * 60 * 60 * 48,
    },
    {
      sessionId: 's-math101',
      courseCode: 'MATH101 – Calculus',
      classroomId: 'Room 101',
      status: 'closed',
      presentCount: 18,
      headCountIntervalMinutes: 5,
      lecturerId: 'lec-other',
      startTime: now - 1000 * 60 * 60 * 72,
      createdAt: now - 1000 * 60 * 60 * 72,
    },
  ]

  const attendanceRecords = [
    { id: 'ar-1', studentId: 'Siti Rahayu', sessionId: 's-cs101', classroomId: 'Room 302', timestamp: now - 1000 * 60 * 12, confidence: 0.91 },
    { id: 'ar-2', studentId: 'Budi Kurniawan', sessionId: 's-cs101', classroomId: 'Room 302', timestamp: now - 1000 * 60 * 10, confidence: 0.88 },
    { id: 'ar-3', studentId: 'John Doe', sessionId: 's-cs101', classroomId: 'Room 302', timestamp: now - 1000 * 60 * 8, confidence: 0.95 },
    { id: 'ar-4', studentId: 'Alice Smith', sessionId: 's-cs101', classroomId: 'Room 302', timestamp: now - 1000 * 60 * 5, confidence: 0.89 },
    { id: 'ar-5', studentId: 'UNKNOWN', sessionId: 's-cs101', classroomId: 'Room 302', timestamp: now - 1000 * 60 * 3, confidence: 0.3 },
  ]

  const alerts = [
    {
      id: 'al-1',
      sessionId: 's-cs101',
      classroomId: 'Room 302',
      biometricCount: 4,
      physicalCount: 5,
      delta: 0.2,
      timestamp: now - 1000 * 60 * 6,
    },
  ]

  const users = [
    {
      uid: lecturerId,
      email: `${lecturerId}@example.com`,
      role: 'lecturer',
      displayName: lecturerName,
    },
    {
      uid: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
      displayName: 'Admin',
    },
  ]

  console.log('Seeding sessions...')
  const batch = db.batch()
  sessions.forEach((s) => {
    const ref = db.collection('sessions').doc(s.sessionId)
    batch.set(ref, s, { merge: true })
  })
  users.forEach((u) => {
    const ref = db.collection('users').doc(u.uid)
    batch.set(ref, u, { merge: true })
  })
  attendanceRecords.forEach((r) => {
    const ref = db.collection('attendanceRecords').doc(r.id)
    batch.set(ref, r, { merge: true })
  })
  alerts.forEach((a) => {
    const ref = db.collection('alerts').doc(a.id)
    batch.set(ref, a, { merge: true })
  })
  await batch.commit()
  
  // Seed head count data to Realtime Database (if available)
  if (rtdb) {
    console.log('Seeding head counts...')
    const headCountData = {
      'Room 302/s-cs101': { count: 7, timestamp: Date.now() },
      'Room 302/s-cs201': { count: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      'Room 302/s-cs301': { count: 28, timestamp: Date.now() - 1000 * 60 * 60 * 48 },
    }
    
    for (const [path, data] of Object.entries(headCountData)) {
      const [classroomId, sessionId] = path.split('/')
      await rtdb.ref(`classrooms/${classroomId}/sessions/${sessionId}/headCounts`).push(data)
    }
    await rtdb.ref('classrooms/Room 302/activeSession').set({
      sessionId: 's-cs101',
      headCountIntervalMinutes: 5,
    })
  }
  
  console.log('Seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
