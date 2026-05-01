import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FullScreenSpinner } from './FullScreenSpinner'
import type { UserRole } from '../types'

interface Props {
  children: ReactNode
  requiredRole?: UserRole
}

export function AuthGuard({ children, requiredRole }: Props) {
  const { user, role, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
