import type { AttendanceRecord } from '../types'

export function AttendanceRow({ record }: { record: AttendanceRecord }) {
  const time = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const confidence = Math.round(record.confidence * 100)
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border2)',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{record.studentId}</div>
        <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{time}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--neon)' }}>{confidence}%</span>
    </div>
  )
}
