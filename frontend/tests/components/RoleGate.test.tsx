import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AuthContext } from '../../src/contexts/AuthContext'
import { RoleGate } from '../../src/components/RoleGate'

describe('RoleGate', () => {
  it('renders children for matching role', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: 'admin', loading: false }}>
        <RoleGate role="admin"><span>admin-content</span></RoleGate>
      </AuthContext.Provider>
    )
    expect(screen.getByText('admin-content')).toBeInTheDocument()
  })

  it('renders nothing for non-matching role', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: 'lecturer', loading: false }}>
        <RoleGate role="admin"><span>admin-content</span></RoleGate>
      </AuthContext.Provider>
    )
    expect(screen.queryByText('admin-content')).not.toBeInTheDocument()
  })
})
