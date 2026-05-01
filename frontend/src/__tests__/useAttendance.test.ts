import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../lib/firebase', () => ({ db: {} }))

let snapshotCallback: ((snap: any) => void) | null = null

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn((...args) => args),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: (_q: any, cb: any) => { snapshotCallback = cb; return () => {} },
}))

import { useAttendance } from '../hooks/useAttendance'

function makeSnap(docs: any[]) {
  return { docs: docs.map(d => ({ data: () => d })) }
}

describe('useAttendance', () => {
  it('returns empty array initially', () => {
    const { result } = renderHook(() => useAttendance('s1'))
    expect(result.current).toEqual([])
  })

  it('filters out UNKNOWN records', async () => {
    const { result } = renderHook(() => useAttendance('s1'))
    await act(async () => {
      snapshotCallback!(makeSnap([
        { studentId: 'S001', sessionId: 's1', classroomId: 'c1', timestamp: 1, confidence: 0.95 },
        { studentId: 'UNKNOWN', sessionId: 's1', classroomId: 'c1', timestamp: 2, confidence: 0.3 },
      ]))
    })
    expect(result.current).toHaveLength(1)
    expect(result.current[0].studentId).toBe('S001')
  })
})
