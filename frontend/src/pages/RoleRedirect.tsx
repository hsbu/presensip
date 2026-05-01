import { Navigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { FullScreenSpinner } from '../components/FullScreenSpinner'
import { ErrorScreen } from '../components/ErrorScreen'

export function RoleRedirect() {
  const { user, role, loading, error } = useAuth()

  if (loading) return <FullScreenSpinner />
  if (error) return (
    <ErrorScreen
      message="Unable to load your profile. Please sign out and try again."
      onSignOut={() => signOut(auth)}
    />
  )
  if (!user) return <Navigate to="/login" replace />
  if (role === 'lecturer') return <Navigate to="/lecturer/dashboard" replace />
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/unauthorized" replace />
}
