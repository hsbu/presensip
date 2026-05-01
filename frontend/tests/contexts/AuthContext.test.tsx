import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/lib/firebase', () => ({
  auth: { onAuthStateChanged: vi.fn((_cb) => () => {}) },
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ role: 'lecturer', displayName: 'Test User', email: 'test@test.com' }),
  }),
}))

import { AuthProvider, AuthContext } from '../../src/contexts/AuthContext'
import { useContext } from 'react'

function Consumer() {
  const ctx = useContext(AuthContext)
  return <div data-testid="role">{ctx.role ?? 'none'}</div>
}

describe('AuthContext', () => {
  it('provides role as null when unauthenticated', () => {
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(screen.getByTestId('role').textContent).toBe('none')
  })
})
