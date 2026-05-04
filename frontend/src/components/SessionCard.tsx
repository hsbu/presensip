import type { Session } from '../types'

interface Props {
  session: Session
  headCount: number | null
  onPress: () => void
  lecturerName?: string
}

export function SessionCard({ session, headCount, onPress, lecturerName }: Props) {
  const startDate = new Date(session.startTime)
  const timeStr = startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const isToday = new Date().toDateString() === startDate.toDateString()
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === startDate.toDateString()
  const dayLabel = isToday
    ? 'Today'
    : isYesterday
    ? 'Yesterday'
    : startDate.toLocaleDateString('en-GB', { weekday: 'short' })
  const subtitleTime = isToday ? `Started ${timeStr}` : `${dayLabel} ${timeStr}`

  return (
    <button
      onClick={onPress}
      style={{
        width: '100%',
        background: 'var(--card)',
        border: '2px solid var(--border2)',
        borderRadius: 14,
        padding: '16px 18px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Top row: course code + chip */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 3,
      }}>
        <span style={{
          fontWeight: 900,
          fontSize: 16,
          color: 'var(--text)',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          flex: 1,
        }}>
          {session.courseCode}
        </span>
        <StatusChip status={session.status} />
      </div>

      {/* Subtitle: room · time */}
      <div style={{
        fontSize: 11,
        color: 'var(--sub)',
        marginBottom: lecturerName ? 3 : 14,
        letterSpacing: '0.01em',
      }}>
        {session.classroomId} · {subtitleTime}
      </div>
      {lecturerName && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, letterSpacing: '0.01em' }}>
          {lecturerName}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
        <StatItem value={session.presentCount} label="Present" />
        <StatItem value={headCount ?? '—'} label="In Room" />
        {session.status === 'active' && (
          <StatItem value={`${session.headCountIntervalMinutes}m`} label="Interval" />
        )}
      </div>
    </button>
  )
}

function StatusChip({ status }: { status: Session['status'] }) {
  if (status === 'active') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--neon)',
        background: 'var(--neon-dim)',
        border: '1.5px solid var(--neon-glow)',
        padding: '4px 10px',
        borderRadius: 20,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--neon)', flexShrink: 0,
        }} />
        Live
      </span>
    )
  }

  if (status === 'pending_verification') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--amber)',
        background: 'var(--amber-dim)',
        border: '1.5px solid var(--amber-glow)',
        padding: '4px 10px',
        borderRadius: 20,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        ⚠ Alert
      </span>
    )
  }

  return (
    <span style={{
      fontSize: 10,
      fontWeight: 800,
      color: 'var(--sub)',
      background: 'rgba(255,255,255,0.04)',
      border: '1.5px solid var(--border2)',
      padding: '4px 10px',
      borderRadius: 20,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      Closed
    </span>
  )
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 24 }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: 22,
        color: 'var(--text)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 9,
        color: 'var(--sub)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.10em',
      }}>
        {label}
      </span>
    </div>
  )
}
