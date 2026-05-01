import type { Alert } from '../types'

export function AlertBanner({ alert }: { alert: Alert }) {
  const diff = alert.physicalCount - alert.biometricCount
  const description = diff > 0
    ? `${diff} unrecognized person${diff > 1 ? 's' : ''} in room. Head count exceeds biometric by ${diff}.`
    : `Biometric count exceeds head count by ${Math.abs(diff)}.`

  return (
    <div style={{
      background: 'var(--amber-dim)', border: '2px solid var(--amber-glow)',
      borderRadius: 12, padding: '14px 14px 14px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>⚠</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--amber)', lineHeight: 1 }}>
          Mismatch Detected
        </span>
        <span style={{ fontSize: 11, color: 'var(--amber)', lineHeight: '1.55', opacity: 0.85 }}>
          {description}
        </span>
      </div>
    </div>
  )
}
