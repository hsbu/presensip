import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/firebase', () => ({ db: {}, rtdb: {} }))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'lec1' }, role: 'lecturer', loading: false, error: null })
}))
const mockSession = {
  sessionId: 's1', classroomId: 'C01', courseCode: 'CS101',
  status: 'active', presentCount: 2, headCountIntervalMinutes: 5,
  lecturerId: 'lec1', startTime: Date.now(),
}
vi.mock('../hooks/useSession', () => ({ useSession: () => mockSession }))
vi.mock('../hooks/useAttendance', () => ({ useAttendance: () => [
  { studentId: 'S001', sessionId: 's1', classroomId: 'C01', timestamp: Date.now(), confidence: 0.95 }
] }))
vi.mock('../hooks/useHeadCount', () => ({ useHeadCount: () => 3 }))
vi.mock('../hooks/useAlerts', () => ({ useAlerts: () => null }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), updateDoc: vi.fn().mockResolvedValue({}) }))
vi.mock('firebase/database', () => ({ ref: vi.fn(), remove: vi.fn().mockResolvedValue({}) }))
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => vi.fn(), useParams: () => ({ id: 's1' }) }
})

import { SessionDetail } from '../pages/SessionDetail'

describe('SessionDetail', () => {
  it('renders course code and count boxes', () => {
    render(<MemoryRouter><SessionDetail /></MemoryRouter>)
    expect(screen.getByText('CS101')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows End Session button when active and not readonly', () => {
    render(<MemoryRouter><SessionDetail /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument()
  })

  it('hides End Session button when readonly', () => {
    render(<MemoryRouter><SessionDetail readonly /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /end session/i })).not.toBeInTheDocument()
  })

  it('renders attendance record', () => {
    render(<MemoryRouter><SessionDetail /></MemoryRouter>)
    expect(screen.getByText('S001')).toBeInTheDocument()
  })
})
