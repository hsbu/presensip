#!/usr/bin/env node
/**
 * HTTP ingestion endpoint for IoT headcount/biometric data
 * POST /api/iot/ingest
 * Required header: x-api-key (match IOT_API_KEY in .env)
 * Body JSON:
 * {
 *   "session_id": "FIRESTORE_SESSION_DOC_ID", // optional when room_id has activeSession mapping
 *   "device_id": "esp32cam-kelas-01",
 *   "room_id": "kelas-01",
 *   "timestamp": "2026-05-03 18:30:00",
 *   "detected_person_name": "John Doe",
 *   "status": "recorded",
 *   "data_type": "biometric" // optional: 'biometric' or 'headcount'
 * }
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import process from 'process'
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'

dotenv.config()

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

function normalizeBiometricKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'unknown'
}

async function main() {
  const serviceAccount = loadServiceAccount()
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: serviceAccount.databaseURL,
  })
  const db = admin.firestore()
  const rtdb = admin.database()

  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  const port = process.env.HTTP_PORT || 3001
  const apiKey = process.env.IOT_API_KEY || 'changeme'

  app.post('/api/iot/ingest', async (req, res) => {
    try {
      const key = req.headers['x-api-key'] || req.query.api_key
      if (!key || key !== apiKey) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        session_id,
        device_id,
        room_id,
        timestamp,
        detected_person_count,
        detected_person_name,
        status,
        data_type,
      } = req.body

      const type = data_type === 'biometric' ? 'biometric' : 'headcount'
      const biometricName = typeof detected_person_name === 'string' ? detected_person_name.trim() : ''
      if (type === 'biometric' && detected_person_count !== undefined) {
        return res.status(400).json({ error: 'detected_person_count is not allowed for biometric payload' })
      }
      if (type === 'biometric' && !biometricName) {
        return res.status(400).json({ error: 'detected_person_name is required for biometric payload' })
      }
      if (type !== 'biometric' && detected_person_count === undefined) {
        return res.status(400).json({ error: 'Invalid payload' })
      }

      let resolvedSessionId = session_id
      if (!resolvedSessionId) {
        if (room_id) {
          const activeSnap = await rtdb.ref(`classrooms/${room_id}/activeSession`).get()
          const activeVal = activeSnap.val()
          resolvedSessionId = typeof activeVal === 'string' ? activeVal : activeVal?.sessionId
        }
        if (!resolvedSessionId) {
          const activeSessionQuery = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .orderBy('startTime', 'desc')
            .limit(1)
            .get()
          if (activeSessionQuery.empty) {
            return res.status(404).json({ error: 'No active session found for fallback' })
          }
          resolvedSessionId = activeSessionQuery.docs[0].id
        }
      }

      const sessionRef = db.collection('sessions').doc(resolvedSessionId)
      const sessionSnap = await sessionRef.get()
      if (!sessionSnap.exists) {
        return res.status(404).json({ error: 'Session not found' })
      }

      const sessionData = sessionSnap.data()
      if (!sessionData || sessionData.status !== 'active') {
        return res.status(409).json({ error: 'Session is not active' })
      }

      const classroomId = sessionData.classroomId
      if (!classroomId) {
        return res.status(409).json({ error: 'Session has no classroomId' })
      }

      const sessionId = sessionSnap.id
      const effectiveRoomId = room_id || classroomId

      if (type === 'biometric') {
        const attendanceKey = `${sessionId}_${normalizeBiometricKey(biometricName)}`
        const attendanceRef = db.collection('attendanceRecords').doc(attendanceKey)

        let nextBiometricCount = Number(sessionData.presentCount ?? 0)
        const wroteNewAttendance = await db.runTransaction(async (tx) => {
          const existingAttendance = await tx.get(attendanceRef)
          if (existingAttendance.exists) return false

          const liveSessionSnap = await tx.get(sessionRef)
          if (!liveSessionSnap.exists) return false

          const liveSessionData = liveSessionSnap.data()
          if (!liveSessionData || liveSessionData.status !== 'active') return false

          nextBiometricCount = Number(liveSessionData.presentCount ?? 0) + 1

          tx.set(attendanceRef, {
            sessionId,
            classroomId,
            studentId: biometricName,
            timestamp: Date.now(),
            confidence: 1,
          })
          tx.update(sessionRef, {
            presentCount: nextBiometricCount,
            lastBiometricUpdate: admin.firestore.FieldValue.serverTimestamp(),
          })
          return true
        })

        if (!wroteNewAttendance) {
          return res.json({ ok: true, sessionId, duplicate: true })
        }

        await rtdb.ref(`classrooms/${classroomId}/sessions/${sessionId}/biometricCounts`).push({
          session_id: sessionId,
          device_id,
          room_id: effectiveRoomId,
          timestamp,
          detected_person_name: biometricName,
          status,
          data_type: 'biometric',
        })

        await db.collection('headcountRecords').add({
          session_id: sessionId,
          device_id,
          room_id: effectiveRoomId,
          data_type: 'biometric',
          biometric_name: biometricName,
          biometric_count: nextBiometricCount,
          timestamp: new Date(timestamp),
          recorded_at: admin.firestore.FieldValue.serverTimestamp(),
          status,
        })
      } else {
        await sessionRef.update({
          headCount: detected_person_count,
          lastHeadcountUpdate: admin.firestore.FieldValue.serverTimestamp(),
        })

        await rtdb.ref(`classrooms/${classroomId}/sessions/${sessionId}/headCounts`).push({
          session_id: sessionId,
          device_id,
          room_id: effectiveRoomId,
          timestamp,
          detected_person_count,
          status,
          data_type: 'headcount',
        })

        await db.collection('headcountRecords').add({
          session_id: sessionId,
          device_id,
          room_id: effectiveRoomId,
          data_type: 'headcount',
          headcount: detected_person_count,
          timestamp: new Date(timestamp),
          recorded_at: admin.firestore.FieldValue.serverTimestamp(),
          status,
        })
      }

      return res.json({ ok: true, sessionId })
    } catch (err) {
      console.error('Ingest error:', err)
      return res.status(500).json({ error: 'Internal error' })
    }
  })

  app.get('/health', (req, res) => res.json({ status: 'ok' }))

  app.listen(port, () => {
    console.log(`HTTP ingestion listening on port ${port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start HTTP ingest:', err)
  process.exit(1)
})
