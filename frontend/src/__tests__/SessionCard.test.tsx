import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SessionCard } from '../components/SessionCard'
import type { Session } from '../types'

const baseSession: Session = {
  sessionId: 's1', classroomId: 'C01', lecturerId: 'l1',
  courseCode: 'CS101', startTime: Date.now(),
  status: 'active', headCountIntervalMinutes: 5, presentCount: 3,
}

describe('SessionCard', () => {
  it('renders courseCode', () => {
    render(<SessionCard session={baseSession} headCount={null} onPress={() => {}} />)
    expect(screen.getByText('CS101')).toBeInTheDocument()
  })

  it('shows dash for headCount when null', () => {
    render(<SessionCard session={baseSession} headCount={null} onPress={() => {}} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows headCount when provided', () => {
    render(<SessionCard session={baseSession} headCount={4} onPress={() => {}} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows presentCount from session', () => {
    render(<SessionCard session={baseSession} headCount={null} onPress={() => {}} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onPress when clicked', async () => {
    const onPress = vi.fn()
    render(<SessionCard session={baseSession} headCount={null} onPress={onPress} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledOnce()
  })
})
