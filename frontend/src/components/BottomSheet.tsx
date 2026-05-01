import { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children }: Props) {
  if (!open) return null
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, background: 'var(--card)',
        borderRadius: '24px 24px 0 0', padding: '24px 16px 40px',
        zIndex: 201, maxHeight: '85dvh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </>
  )
}
