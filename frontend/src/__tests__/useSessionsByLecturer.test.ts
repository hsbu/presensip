import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../lib/firebase', () => ({ db: {} }))

let snapshotCallback: ((snap: any) => void) | null = null

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), query: vi.fn((...a) => a),
  where: vi.fn(), orderBy: vi.fn(),
  onSnapshot: (_q: any, cb: any) => { snapshotCallback = cb; return () => {} },
}))

import { useSessionsByLecturer } from '../hooks/useSessionsByLecturer'

describe('useSessionsByLecturer', () => {
  it('returns empty array initially', () => {
    const { result } = renderHook(() => useSessionsByLecturer('lec1'))
    expect(result.current).toEqual([])
  })

  it('returns sessions from snapshot', async () => {
    const { result } = renderHook(() => useSessionsByLecturer('lec1'))
    await act(async () => {
      snapshotCallback!({ docs: [{ data: () => ({ sessionId: 's1', lecturerId: 'lec1', presentCount: 0 }) }] })
    })
    expect(result.current).toHaveLength(1)
    expect(result.current[0].sessionId).toBe('s1')
  })
})
