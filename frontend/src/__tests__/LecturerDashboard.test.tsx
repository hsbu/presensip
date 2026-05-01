import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/firebase', () => ({ auth: { currentUser: { uid: 'lec1', displayName: 'Dr. Ahmad' } }, db: {}, rtdb: {} }))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'lec1', displayName: 'Dr. Ahmad' }, role: 'lecturer', loading: false, error: null })
}))
vi.mock('../hooks/useSessionsByLecturer', () => ({
  useSessionsByLecturer: () => [
    { sessionId: 's1', courseCode: 'CS101', classroomId: 'C01', status: 'active', presentCount: 3, headCountIntervalMinutes: 5, lecturerId: 'lec1', startTime: Date.now() }
  ]
}))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(), collection: vi.fn(() => ({})), setDoc: vi.fn().mockResolvedValue({})
}))
vi.mock('firebase/database', () => ({ ref: vi.fn(), set: vi.fn().mockResolvedValue({}) }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

import { LecturerDashboard } from '../pages/LecturerDashboard'

describe('LecturerDashboard', () => {
  it('renders greeting with displayName', () => {
    render(<MemoryRouter><LecturerDashboard /></MemoryRouter>)
    expect(screen.getByText(/Dr\. Ahmad/)).toBeInTheDocument()
  })

  it('renders session card', () => {
    render(<MemoryRouter><LecturerDashboard /></MemoryRouter>)
    expect(screen.getByText('CS101')).toBeInTheDocument()
  })

  it('shows Start New Session button', () => {
    render(<MemoryRouter><LecturerDashboard /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument()
  })

  it('opens bottom sheet on Start New Session click', async () => {
    render(<MemoryRouter><LecturerDashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /start new session/i }))
    expect(screen.getByPlaceholderText(/course code/i)).toBeInTheDocument()
  })
})
