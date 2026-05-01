import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthContext } from '../../src/contexts/AuthContext'
import { AuthGuard } from '../../src/components/AuthGuard'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div> }
})

describe('AuthGuard', () => {
  it('renders children when authenticated', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { uid: '1' } as any, role: 'lecturer', loading: false }}>
          <AuthGuard><div>protected</div></AuthGuard>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    expect(screen.getByText('protected')).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, role: null, loading: false }}>
          <AuthGuard><div>protected</div></AuthGuard>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    expect(screen.getByText('redirect:/login')).toBeInTheDocument()
  })
})
