import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../lib/firebase', () => ({ rtdb: {} }))

let valueCallback: ((snap: any) => void) | null = null

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  query: vi.fn((...args) => args),
  limitToLast: vi.fn(),
  onValue: (_q: any, cb: any) => { valueCallback = cb; return () => {} },
}))

import { useHeadCount } from '../hooks/useHeadCount'

describe('useHeadCount', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useHeadCount('c1', 's1'))
    expect(result.current).toBeNull()
  })

  it('returns null when classroomId is null', () => {
    const { result } = renderHook(() => useHeadCount(null, 's1'))
    expect(result.current).toBeNull()
  })

  it('returns count from snapshot entry', async () => {
    const { result } = renderHook(() => useHeadCount('c1', 's1'))
    await act(async () => {
      valueCallback!({ exists: () => true, val: () => ({ '1700': { count: 5, timestamp: 1700 } }) })
    })
    expect(result.current).toBe(5)
  })

  it('returns null when snapshot has no data', async () => {
    const { result } = renderHook(() => useHeadCount('c1', 's1'))
    await act(async () => { valueCallback!({ exists: () => false }) })
    expect(result.current).toBeNull()
  })
})
