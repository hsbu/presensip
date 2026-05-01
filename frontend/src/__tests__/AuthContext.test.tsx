import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../lib/firebase', () => ({ auth: {}, db: {} }))

let authCallback: ((user: any) => void) | null = null
let getDocFn = vi.fn()

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: any, cb: any) => { authCallback = cb; return () => {} },
}))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: (...args: any[]) => getDocFn(...args),
}))

import { AuthProvider, useAuthContext } from '../contexts/AuthContext'

function Probe() {
  const { loading, error, role } = useAuthContext()
  return <div data-testid="probe" data-loading={String(loading)} data-error={error ?? ''} data-role={role ?? ''} />
}

function setup() {
  render(<AuthProvider><Probe /></AuthProvider>)
  return screen.getByTestId('probe')
}

describe('AuthContext', () => {
  beforeEach(() => { authCallback = null; getDocFn = vi.fn() })

  it('starts loading', () => {
    const probe = setup()
    expect(probe.dataset.loading).toBe('true')
  })

  it('resolves to no user when signed out', async () => {
    const probe = setup()
    await act(async () => { authCallback!(null) })
    expect(probe.dataset.loading).toBe('false')
    expect(probe.dataset.role).toBe('')
  })

  it('resolves role when user and doc exist', async () => {
    getDocFn.mockResolvedValue({ exists: () => true, data: () => ({ role: 'lecturer' }) })
    const probe = setup()
    await act(async () => { authCallback!({ uid: 'u1' }) })
    expect(probe.dataset.loading).toBe('false')
    expect(probe.dataset.role).toBe('lecturer')
    expect(probe.dataset.error).toBe('')
  })

  it('sets error when getDoc fails', async () => {
    getDocFn.mockRejectedValue(new Error('network'))
    const probe = setup()
    await act(async () => { authCallback!({ uid: 'u1' }) })
    expect(probe.dataset.loading).toBe('false')
    expect(probe.dataset.error).toBe('role_fetch_failed')
  })
})
