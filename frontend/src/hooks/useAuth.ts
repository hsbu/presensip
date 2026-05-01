import { useAuthContext } from '../contexts/AuthContext'

export function useAuth() {
  const ctx = useAuthContext()
  return ctx
}
