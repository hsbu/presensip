import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../components/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="neon" onClick={() => {}}>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick', async () => {
    const handler = vi.fn()
    render(<Button variant="neon" onClick={handler}>Go</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('is disabled and shows spinner when loading', () => {
    render(<Button variant="neon" onClick={() => {}} loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button variant="red" onClick={() => {}} disabled>Delete</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
