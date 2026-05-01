import { useState } from 'react'
import type { Enrollment } from '../types'

interface Props {
  enrollment: Enrollment
  onDelete: () => Promise<void>
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function EnrollmentRow({ enrollment, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete()
    } catch {
      setDeleteError('Failed to remove student')
      setDeleting(false)
    }
  }

  const initials = getInitials(enrollment.studentName || enrollment.studentId)

  return (
    <>
      <div
        data-testid="enrollment-row"
        onContextMenu={(e) => { e.preventDefault(); setConfirming(true) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--card)', border: '2px solid var(--border2)',
          borderRadius: 12, padding: '14px', marginBottom: 8,
          opacity: deleting ? 0.5 : 1, cursor: 'context-menu',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'var(--card2)', border: '2px solid var(--border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
          fontSize: 13, color: 'var(--blue)',
        }}>{initials}</div>

        {/* Name + NIM */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1 }}>
            {enrollment.studentName || '—'}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--sub)', marginTop: 4,
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: '0.06em',
          }}>
            NIM · {enrollment.studentId}
          </div>
          {deleteError && <span style={{ fontSize: 11, color: 'var(--red)', display: 'block', marginTop: 2 }}>{deleteError}</span>}
        </div>

        {/* Active badge */}
        <span style={{
          fontSize: 9, fontWeight: 800, color: 'var(--neon)',
          background: 'var(--neon-dim)', border: '1.5px solid var(--neon-glow)',
          padding: '5px 10px', borderRadius: 20, letterSpacing: '0.09em',
          textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
        }}>Active</span>
      </div>

      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, width: 300 }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Remove student?</p>
            <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 24 }}>
              {enrollment.studentName} will be unenrolled.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirming(false)}
                style={{ flex: 1, background: 'var(--card2)', color: 'var(--text)', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => { setConfirming(false); handleDelete() }}
                style={{ flex: 1, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
