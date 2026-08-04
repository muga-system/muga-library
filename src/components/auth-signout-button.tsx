"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { LoaderCircle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type AuthSignOutButtonProps = {
  initialAuthenticated?: boolean
}

export function AuthSignOutButton({ initialAuthenticated = false }: AuthSignOutButtonProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)

  useEffect(() => {
    if (!loading) setAuthenticated(Boolean(user))
  }, [loading, user])

  const handleSignOut = async () => {
    await signOut()
    setAuthenticated(false)
    router.push("/iniciar-sesion")
  }

  if (loading && !authenticated) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
      >
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Cargando...
      </button>
    )
  }

  if (!authenticated) {
    return (
      <Link 
        href="/iniciar-sesion"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
        Iniciar Sesión
      </Link>
    )
  }

  return (
    <button 
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </button>
  )
}
