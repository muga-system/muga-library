"use client"

import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthCheckProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthCheck({ children, fallback }: AuthCheckProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/iniciar-sesion")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user && fallback) {
    return <>{fallback}</>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
