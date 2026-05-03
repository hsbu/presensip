import React, { useState } from 'react'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { useAuth } from '../hooks/useAuth'
import { useEnrollments } from '../hooks/useEnrollments'
import { AppShell } from '../components/AppShell'
import { StatCard } from '../components/StatCard'
import { EnrollmentRow } from '../components/EnrollmentRow'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/BottomSheet'
import { enrollStudent } from '../lib/enrollStudent'

const ENROLLFACE_URL = (import.meta as any).env?.VITE_ENROLLFACE_URL as string

export function EnrollmentsPage() {
  const enrollments = useEnrollments()
  const { user } = useAuth()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [name, setName] = useState('')
  const [nim, setNim] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const resetSheet = () => { setName(''); setNim(''); setPhotos([]); setEnrollError(null) }

  const addPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 80,
      })
      if (photo.base64String) setPhotos(prev => [...prev, photo.base64String!])
    } catch {
      // user cancelled
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    setEnrollError(null)
    try {
      await enrollStudent({
        studentId: nim,
        studentName: name,
        images: photos,
        enrolledBy: user?.uid ?? 'admin',
        enrollFaceUrl: ENROLLFACE_URL,
      })
      setEnrolling(false)
      setSheetOpen(false)
      resetSheet()
    } catch {
      setEnrollError('Enrollment failed. Please try again.')
      setEnrolling(false)
    }
  }

  return (
    <AppShell>
      <div style={{ paddingTop: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>Enrollments</h1>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6, letterSpacing: '0.02em' }}>
            {enrollments === null ? '—' : `${enrollments.length} students registered`}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <StatCard value={enrollments?.length ?? null} label="Enrolled" color="white" />
          <StatCard value={enrollments?.length ?? null} label="Active" color="neon" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Button variant="neon" onClick={() => setSheetOpen(true)} fullWidth>+ Enroll New Student</Button>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Students</p>
        {enrollments !== null && enrollments.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 13, padding: '32px 0' }}>
            No students enrolled yet
          </p>
        )}
        {(enrollments ?? []).map(e => (
          <EnrollmentRow
            key={e.studentId}
            enrollment={e}
            onDelete={async () => { await deleteDoc(doc(db, 'enrollments', e.studentId)) }}
          />
        ))}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); resetSheet() }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Enroll New Student</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Student Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <input placeholder="NIM (Student ID)" value={nim} onChange={e => setNim(e.target.value)} style={inputStyle} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {photos.map((p, i) => (
              <img key={i} src={`data:image/jpeg;base64,${p}`} alt={`photo ${i + 1}`}
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10 }} />
            ))}
            <button onClick={addPhoto} style={{
              width: 64, height: 64, background: 'var(--card2)',
              border: '1px dashed var(--border2)', borderRadius: 10,
              color: 'var(--sub)', fontSize: 22, cursor: 'pointer',
            }}>+</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{photos.length}/10 photos · minimum 5 required</p>

          {enrollError && <p style={{ fontSize: 13, color: 'var(--red)' }}>{enrollError}</p>}

          <Button
            variant="neon" onClick={handleEnroll} loading={enrolling}
            disabled={photos.length < 5 || !name.trim() || !nim.trim()} fullWidth
          >
            {enrolling ? 'Enrolling…' : 'Enroll'}
          </Button>
        </div>
      </BottomSheet>
    </AppShell>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: 14,
  padding: '14px', fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%',
}
