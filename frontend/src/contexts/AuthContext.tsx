import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { UserRole } from '../types'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
  error: string | null
}

const defaultState: AuthState = { user: null, role: null, loading: true, error: null }

export const AuthContext = createContext<AuthState>(defaultState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, loading: false, error: null })
        return
      }
      setState(prev => ({ ...prev, loading: true, error: null }))
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const role = snap.exists() ? (snap.data().role as UserRole) : null
        setState({ user, role, loading: false, error: null })
      } catch {
        setState({ user, role: null, loading: false, error: 'role_fetch_failed' })
      }
    })
    return unsub
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  return useContext(AuthContext)
}
