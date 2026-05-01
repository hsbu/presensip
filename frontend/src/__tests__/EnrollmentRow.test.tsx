import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EnrollmentRow } from '../components/EnrollmentRow'
import type { Enrollment } from '../types'

const enrollment: Enrollment = {
  studentId: '2021001', studentName: 'Budi Santoso',
  embedding: [], enrolledAt: Date.now(), enrolledBy: 'admin1',
}

describe('EnrollmentRow', () => {
  it('renders student name and ID', () => {
    render(<EnrollmentRow enrollment={enrollment} onDelete={async () => {}} />)
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('2021001')).toBeInTheDocument()
  })

  it('shows confirmation dialog on right-click, then calls onDelete on confirm', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<EnrollmentRow enrollment={enrollment} onDelete={onDelete} />)
    await userEvent.pointer({ target: screen.getByTestId('enrollment-row'), keys: '[MouseRight]' })
    const confirmBtn = await screen.findByRole('button', { name: /remove/i })
    await userEvent.click(confirmBtn)
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
