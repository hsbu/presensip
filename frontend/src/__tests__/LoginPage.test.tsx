import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/firebase', () => ({ auth: {} }))

const mockSignIn = vi.fn()
vi.mock('firebase/auth', () => ({ signInWithEmailAndPassword: (...a: any[]) => mockSignIn(...a) }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

import { LoginPage } from '../pages/LoginPage'

describe('LoginPage', () => {
  it('renders brand, inputs, and sign in button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText('Presensip')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls signInWithEmailAndPassword on submit', async () => {
    mockSignIn.mockResolvedValue({})
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'pass123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({}, 'user@test.com', 'pass123'))
  })

  it('shows error message on auth failure', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText(/email/i), 'bad@test.com')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument())
  })
})
