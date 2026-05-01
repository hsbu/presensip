import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'adm1' }, role: 'admin', loading: false, error: null })
}))
vi.mock('../hooks/useAllSessions', () => ({
  useAllSessions: () => [
    { sessionId: 's1', courseCode: 'CS101', classroomId: 'C01', status: 'active', presentCount: 2, headCountIntervalMinutes: 5, lecturerId: 'lec1', startTime: Date.now() },
    { sessionId: 's2', courseCode: 'CS202', classroomId: 'C01', status: 'closed', presentCount: 5, headCountIntervalMinutes: 10, lecturerId: 'lec2', startTime: Date.now() - 86400000 },
  ]
}))

import { AdminDashboard } from '../pages/AdminDashboard'

describe('AdminDashboard', () => {
  it('renders sessions heading and total count', () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('2 sessions total')).toBeInTheDocument()
  })

  it('shows Active Now stat label', () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    expect(screen.getByText('Active Now')).toBeInTheDocument()
  })

  it('renders both session cards', () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    expect(screen.getByText('CS101')).toBeInTheDocument()
    expect(screen.getByText('CS202')).toBeInTheDocument()
  })
})
