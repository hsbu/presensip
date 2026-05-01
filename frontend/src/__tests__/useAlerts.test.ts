import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../lib/firebase', () => ({ db: {} }))

let snapshotCallback: ((snap: any) => void) | null = null

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn((...args) => args),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: (_q: any, cb: any) => { snapshotCallback = cb; return () => {} },
}))

import { useAlerts } from '../hooks/useAlerts'

describe('useAlerts', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useAlerts('s1'))
    expect(result.current).toBeNull()
  })

  it('returns first alert when snapshot has docs', async () => {
    const { result } = renderHook(() => useAlerts('s1'))
    const alert = { sessionId: 's1', classroomId: 'c1', biometricCount: 4, physicalCount: 5, delta: 1, timestamp: 100 }
    await act(async () => {
      snapshotCallback!({ docs: [{ data: () => alert }] })
    })
    expect(result.current).toEqual(alert)
  })

  it('returns null when snapshot has no docs', async () => {
    const { result } = renderHook(() => useAlerts('s1'))
    await act(async () => { snapshotCallback!({ docs: [] }) })
    expect(result.current).toBeNull()
  })
})
