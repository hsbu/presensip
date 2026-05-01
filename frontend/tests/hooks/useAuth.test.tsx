import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AuthContext } from '../../src/contexts/AuthContext'
import { useAuth } from '../../src/hooks/useAuth'

function TestComp() {
  const { role } = useAuth()
  return <span data-testid="r">{role ?? 'null'}</span>
}

describe('useAuth', () => {
  it('reads role from context', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: 'admin', loading: false }}>
        <TestComp />
      </AuthContext.Provider>
    )
    expect(screen.getByTestId('r').textContent).toBe('admin')
  })
})
