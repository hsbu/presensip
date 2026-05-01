import { render, screen } from '@testing-library/react'
import { StatCard } from '../components/StatCard'

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard value={4} label="Present" color="neon" />)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Present')).toBeInTheDocument()
  })

  it('renders dash when value is null', () => {
    render(<StatCard value={null} label="Present" color="neon" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
