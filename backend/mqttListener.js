#!/usr/bin/env node
/**
 * MQTT Listener for HiveMQ headcount data
 * Subscribes to presensip/headcount/# and updates Firebase RTDB
 * Usage: npm run mqtt:listen
 * Payload can include session_id, or backend will resolve it from
 * classrooms/{room_id}/activeSession in RTDB.
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import process from 'process'
import admin from 'firebase-admin'
import mqtt from 'mqtt'

// Load .env file
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

function makeClient(host, port, user, pass) {
  return mqtt.connect(`mqtts://${host}:${port}`, {
    username: user,
    password: pass,
    protocol: 'mqtts',
    reconnectPeriod: 5000,
    clean: true,
  })
}

// create both clients
const clientA = makeClient(
  process.env.MQTT_BROKER_A,
  process.env.MQTT_PORT_A || 8883,
  process.env.MQTT_USERNAME_A,
  process.env.MQTT_PASSWORD_A
)
const clientB = makeClient(
  process.env.MQTT_BROKER_B,
  process.env.MQTT_PORT_B || 8883,
  process.env.MQTT_USERNAME_B,
  process.env.MQTT_PASSWORD_B
)

const topicsA = [
  process.env.MQTT_HEADCOUNT_TOPIC_A || 'presensip/headcount/#'
]
const topicsB = [
  process.env.MQTT_BIOMETRIC_TOPIC_B || 'presensip/biometric/#'
]

// subscribe when connected
clientA.on('connect', () => {
  console.log(`Connected to headcount broker: ${process.env.MQTT_BROKER_A || 'unset'}`)
  topicsA.forEach(t => clientA.subscribe(t, err => {
    if (err) console.error('subA', err)
    else console.log(`Subscribed headcount topic: ${t}`)
  }))
})
clientB.on('connect', () => {
  console.log(`Connected to biometric broker: ${process.env.MQTT_BROKER_B || 'unset'}`)
  topicsB.forEach(t => clientB.subscribe(t, err => {
    if (err) console.error('subB', err)
    else console.log(`Subscribed biometric topic: ${t}`)
  }))
})

// dedupe helper (simple in-memory)
const recent = new Map()
function seenRecently(id, win=30000){
  if(!id) return false
  const now=Date.now(), prev=recent.get(id)
  if(prev && now-prev < win) return true
  recent.set(id, now)
  setTimeout(()=>recent.delete(id), win+2000)
  return false
}

function normalizeBiometricKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'unknown'
}

// message handlers are attached after Firebase initialization in main()

async function main() {
  const serviceAccount = loadServiceAccount()
  
  // Initialize Firebase
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: serviceAccount.databaseURL,
  })
  
  const db = admin.firestore()
  const rtdb = admin.database()
  
  // single handler reused by both clients (uses db and rtdb)
  async function handleMessage(topic, payload){
    try {
      const data = JSON.parse(payload.toString())
      if(data.message_id && seenRecently(data.message_id)) return

      const { session_id, device_id, room_id, timestamp, detected_person_count, detected_person_name, status, data_type } = data
      const isBiometric = (data_type === 'biometric') || topic.includes('biometric')
      const biometricName = typeof detected_person_name === 'string' ? detected_person_name.trim() : ''
      if (isBiometric && detected_person_count !== undefined) {
        console.warn('Biometric payload must not include detected_person_count; skipping')
        return
      }
      if (isBiometric && !biometricName) {
        console.warn('Biometric payload missing detected_person_name; skipping')
        return
      }
      if (!isBiometric && detected_person_count === undefined) {
        console.warn('Invalid message format, skipping')
        return
      }

      let resolvedSessionId = session_id
      if (!resolvedSessionId) {
        if (room_id) {
          const activeSnap = await rtdb.ref(`classrooms/${room_id}/activeSession`).get()
          const activeVal = activeSnap.val()
          resolvedSessionId = typeof activeVal === 'string' ? activeVal : activeVal?.sessionId
          if (!resolvedSessionId) {
            console.warn(`No activeSession mapping found for room ${room_id}; trying global active session fallback`)
          }
        }
        if (!resolvedSessionId) {
          const activeSessionQuery = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .orderBy('startTime', 'desc')
            .limit(1)
            .get()
          if (activeSessionQuery.empty) {
            console.warn('No active session found for fallback; skipping update')
            return
          }
          resolvedSessionId = activeSessionQuery.docs[0].id
          console.warn(`Using fallback active session ${resolvedSessionId}`)
        }
      }

      const sessionRef = db.collection('sessions').doc(resolvedSessionId)
      const sessionSnap = await sessionRef.get()
      if (!sessionSnap.exists) {
        console.warn(`Session ${resolvedSessionId} not found; skipping update`)
        return
      }

      const sessionData = sessionSnap.data()
      if (!sessionData || sessionData.status !== 'active') {
        console.warn(`Session ${resolvedSessionId} is not active; skipping update`)
        return
      }

      const classroomId = sessionData.classroomId
      if (!classroomId) {
        console.warn(`Session ${resolvedSessionId} has no classroomId; skipping update`)
        return
      }

      if (room_id && room_id !== classroomId) {
        console.warn(`Payload room_id (${room_id}) != session classroomId (${classroomId}); using session classroomId`)
      }

      const sessionId = sessionSnap.id
      const effectiveRoomId = room_id || classroomId

      // Update session fields and write to RTDB + history
      if (isBiometric) {
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
          console.warn(`Duplicate biometric scan ignored for ${biometricName} in session ${sessionId}`)
          return
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

      console.log(`Processed ${isBiometric ? 'biometric' : 'headcount'} from ${device_id} for session ${sessionId}`)
    } catch (err) {
      console.error('Error processing message:', err)
    }
  }

  // attach handler to clients
  clientA.on('message', handleMessage)
  clientB.on('message', handleMessage)
  
  // MQTT Configuration
  const mqttBroker = process.env.MQTT_BROKER || 'YOUR_HIVEMQ_HOST'
  const mqttPort = process.env.MQTT_PORT || 8883
  const mqttUsername = process.env.MQTT_USERNAME || 'YOUR_USERNAME'
  const mqttPassword = process.env.MQTT_PASSWORD || 'YOUR_PASSWORD'
  
  console.log('Starting MQTT Listener...')
  console.log(`Connecting to ${mqttBroker}:${mqttPort}`)
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...')
    clientA.end()
    clientB.end()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
