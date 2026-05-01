import { describe, it, expect } from 'vitest'

describe('firebase', () => {
  it('exports db without throwing', async () => {
    const { db } = await import('../../src/lib/firebase')
    expect(db).toBeDefined()
  })

  it('exports rtdb without throwing', async () => {
    const { rtdb } = await import('../../src/lib/firebase')
    expect(rtdb).toBeDefined()
  })

  it('exports auth without throwing', async () => {
    const { auth } = await import('../../src/lib/firebase')
    expect(auth).toBeDefined()
  })
})
