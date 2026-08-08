"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const { user } = await getCurrentUser()
    setSession(user ? { user } : null)
    setUser(user)
    setLoading(false)
    return user
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const signOut = async () => {
    await signOutRequest()
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
