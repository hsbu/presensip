import React, { useState } from 'react'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEnrollments } from '../hooks/useEnrollments'
import { WebShell } from '../components/WebShell'
import type { Enrollment } from '../types'

const ENROLLFACE_URL = (import.meta as any).env?.VITE_ENROLLFACE_URL as string

export function EnrollmentsWeb() {
  const enrollments = useEnrollments()

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [nim, setNim] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const resetModal = () => { setName(''); setNim(''); setEnrollError(null) }

  const handleEnroll = async () => {
    if (!name.trim() || !nim.trim()) return
    setEnrolling(true)
    setEnrollError(null)
    try {
      const res = await fetch(ENROLLFACE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: nim.trim(), studentName: name.trim(), images: [] }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setEnrollError(data.error ?? 'Enrollment failed. Please try again.')
        setEnrolling(false)
        return
      }
      setModalOpen(false)
      resetModal()
    } catch {
      setEnrollError('Enrollment failed. Please try again.')
      setEnrolling(false)
    }
  }

  const handleDelete = async (studentId: string) => {
    await deleteDoc(doc(db, 'enrollments', studentId))
    setDeleteConfirm(null)
  }

  const count = enrollments?.length ?? 0

  return (
    <WebShell
      title="Enrollments"
      topbarRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--sub)' }}>{count} students registered</span>
          <button onClick={() => setModalOpen(true)} style={btnNeon}>+ Enroll New Student</button>
        </div>
      }
    >
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard value={count} label="Enrolled" color="var(--text)" />
        <StatCard value={count} label="Active" color="var(--neon)" />
        <StatCard value={0} label="Pending" color="var(--sub)" />
        <StatCard value={new Date().getFullYear()} label="Period" color="var(--text)" />
      </div>

      {/* Students grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={secLbl}>Students</span>
      </div>

      {enrollments !== null && enrollments.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 13, padding: '48px 0' }}>
          No students enrolled yet
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {(enrollments ?? []).map(e => (
          <EnrollCard
            key={e.studentId}
            enrollment={e}
            onDelete={() => setDeleteConfirm(e.studentId)}
          />
        ))}
      </div>

      {/* Enroll modal */}
      {modalOpen && (
        <Modal onClose={() => { setModalOpen(false); resetModal() }}>
          <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 6 }}>Enroll New Student</h2>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 24 }}>
            Student photos are captured via the door ESP32-CAM during the enrollment session.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Student Name">
              <input placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="NIM (Student ID)">
              <input placeholder="e.g. 2021001" value={nim} onChange={e => setNim(e.target.value)} style={inputStyle} />
            </Field>
            {enrollError && (
              <p style={{ fontSize: 12, color: 'var(--red)', padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 10, border: '1px solid var(--red-glow)' }}>
                {enrollError}
              </p>
            )}
            <button
              onClick={handleEnroll}
              disabled={enrolling || !name.trim() || !nim.trim()}
              style={{ ...btnNeon, width: '100%', justifyContent: 'center', opacity: (enrolling || !name.trim() || !nim.trim()) ? 0.5 : 1 }}
            >
              {enrolling ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <h2 style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 8 }}>Remove Enrollment?</h2>
          <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 24 }}>
            This will permanently delete the student's face embedding. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnRedFull, flex: 1, justifyContent: 'center' }}>Remove</button>
          </div>
        </Modal>
      )}
    </WebShell>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EnrollCard({ enrollment, onDelete }: { enrollment: Enrollment; onDelete: () => void }) {
  const initials = enrollment.studentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 12,
      padding: 14, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: 'var(--card2)', border: '2px solid var(--border2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--blue)',
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {enrollment.studentName}
        </div>
        <div style={{ fontSize: 10, color: 'var(--sub)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.06em' }}>
          NIM · {enrollment.studentId}
        </div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 800, color: 'var(--neon)', background: 'var(--neon-dim)',
        border: '1.5px solid var(--neon-glow)', padding: '5px 10px', borderRadius: 20,
        textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'default',
        marginRight: 4,
      }}>Active</span>
      <button
        onClick={onDelete}
        title="Remove enrollment"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
          color: 'var(--muted)', fontSize: 14, borderRadius: 6, lineHeight: 1,
          transition: 'color 0.13s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'}
      >✕</button>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 14, padding: '18px 18px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 38, lineHeight: 1, letterSpacing: '-0.04em', color }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 20, padding: '28px 28px 24px', width: 420, maxWidth: '90vw' }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const secLbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.14em',
} as React.CSSProperties
const btnNeon: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'var(--neon)', color: '#0e0e0e',
  fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: 13,
  padding: '11px 22px', borderRadius: 11, border: 'none', cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'transparent', color: 'var(--sub)', border: '1.5px solid var(--border2)',
  fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 13,
  padding: '11px 22px', borderRadius: 11, cursor: 'pointer',
}
const btnRedFull: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--red-dim)', color: 'var(--red)', border: '1.5px solid var(--red-glow)',
  fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: 13,
  padding: '11px 22px', borderRadius: 11, cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  background: 'var(--card2)', border: '2px solid var(--border2)',
  borderRadius: 12, padding: '13px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%',
}
