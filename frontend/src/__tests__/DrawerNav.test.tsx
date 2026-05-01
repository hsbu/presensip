import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

import { useAuth } from '../hooks/useAuth'
import { DrawerNav } from '../components/DrawerNav'

describe('DrawerNav', () => {
  it('renders nothing when closed', () => {
    vi.mocked(useAuth).mockReturnValue({ role: 'lecturer', user: {} as any, loading: false, error: null })
    render(<MemoryRouter><DrawerNav open={false} onClose={() => {}} /></MemoryRouter>)
    expect(screen.queryByText('Sessions')).not.toBeInTheDocument()
  })

  it('shows lecturer nav items when open', () => {
    vi.mocked(useAuth).mockReturnValue({ role: 'lecturer', user: {} as any, loading: false, error: null })
    render(<MemoryRouter><DrawerNav open={true} onClose={() => {}} /></MemoryRouter>)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.queryByText('Enrollments')).not.toBeInTheDocument()
  })

  it('shows admin nav items including Enrollments when role is admin', () => {
    vi.mocked(useAuth).mockReturnValue({ role: 'admin', user: {} as any, loading: false, error: null })
    render(<MemoryRouter><DrawerNav open={true} onClose={() => {}} /></MemoryRouter>)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Enrollments')).toBeInTheDocument()
  })

  it('calls onClose when backdrop clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({ role: 'lecturer', user: {} as any, loading: false, error: null })
    const onClose = vi.fn()
    render(<MemoryRouter><DrawerNav open={true} onClose={onClose} /></MemoryRouter>)
    await userEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
