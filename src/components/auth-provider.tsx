"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { getCurrentUser, signOut as signOutRequest, type ClientUser } from "@/lib/auth/client"

type Session = { user: ClientUser }

type AuthContextType = {
  user: ClientUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<ClientUser | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => null,
})

type AuthProviderProps = {
  children: React.ReactNode
  initialUser?: ClientUser | null
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<ClientUser | null>(initialUser)
  const [session, setSession] = useState<Session | null>(initialUser ? { user: initialUser } : null)
  const [loading, setLoading] = useState(true)
  const requestVersion = useRef(0)
  const userRef = useRef<ClientUser | null>(initialUser)

  const refreshSession = useCallback(async () => {
    const version = ++requestVersion.current
    const result = await getCurrentUser()

    // A request started before login/logout must not overwrite the newer state.
    if (version !== requestVersion.current) return userRef.current

    // Keep the server-provided user during a transient network failure.
    if (result.error) {
      setLoading(false)
      return userRef.current
    }

    userRef.current = result.user
    setSession(result.user ? { user: result.user } : null)
    setUser(result.user)
    setLoading(false)
    return result.user
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const signOut = async () => {
    requestVersion.current += 1
    await signOutRequest()
    userRef.current = null
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
