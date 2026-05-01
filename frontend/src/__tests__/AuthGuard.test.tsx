import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

import { useAuth } from '../hooks/useAuth'
import { AuthGuard } from '../components/AuthGuard'

describe('AuthGuard', () => {
  it('shows spinner (not content) when loading', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, role: null, loading: true, error: null })
    render(<MemoryRouter><AuthGuard><div>content</div></AuthGuard></MemoryRouter>)
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated with correct role', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: 'u1' } as any, role: 'lecturer', loading: false, error: null })
    render(<MemoryRouter><AuthGuard requiredRole="lecturer"><div>content</div></AuthGuard></MemoryRouter>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('redirects to /login when no user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, role: null, loading: false, error: null })
    render(<MemoryRouter><AuthGuard><div>content</div></AuthGuard></MemoryRouter>)
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })

  it('redirects to /unauthorized on role mismatch', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: 'u1' } as any, role: 'lecturer', loading: false, error: null })
    render(<MemoryRouter><AuthGuard requiredRole="admin"><div>content</div></AuthGuard></MemoryRouter>)
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })
})
