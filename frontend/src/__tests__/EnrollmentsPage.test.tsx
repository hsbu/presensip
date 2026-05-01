import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'adm1' }, role: 'admin', loading: false, error: null })
}))
vi.mock('../hooks/useEnrollments', () => ({
  useEnrollments: () => [
    { studentId: '2021001', studentName: 'Budi Santoso', embedding: [], enrolledAt: Date.now(), enrolledBy: 'adm1' },
  ]
}))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), deleteDoc: vi.fn().mockResolvedValue({}) }))
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn().mockResolvedValue({ base64String: 'abc' }) },
  CameraResultType: { Base64: 'base64' },
  CameraSource: { Camera: 'CAMERA' },
}))

import { EnrollmentsPage } from '../pages/EnrollmentsPage'

describe('EnrollmentsPage', () => {
  it('renders heading and student count', () => {
    render(<MemoryRouter><EnrollmentsPage /></MemoryRouter>)
    expect(screen.getByText('Enrollments')).toBeInTheDocument()
    expect(screen.getByText('1 students registered')).toBeInTheDocument()
  })

  it('renders enrolled student', () => {
    render(<MemoryRouter><EnrollmentsPage /></MemoryRouter>)
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
  })

  it('opens enrollment sheet on button click', async () => {
    render(<MemoryRouter><EnrollmentsPage /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /enroll new student/i }))
    expect(screen.getByPlaceholderText(/student name/i)).toBeInTheDocument()
  })
})
