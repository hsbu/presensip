import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

interface Props {
  role: UserRole
  children: ReactNode
}

export function RoleGate({ role, children }: Props) {
  const { role: userRole } = useAuth()
  return userRole === role ? <>{children}</> : null
}
