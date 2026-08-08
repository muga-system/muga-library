"use client"

import Link from "next/link"
import { KeyRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AuthSignOutButton } from "@/components/auth-signout-button"
import { UserAvatar } from "@/components/user-avatar"

type InitialUser = {
  email: string
  app_metadata: { role: string }
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

function getPanelHref(role: string) {
  if (role === "reader") return "/mis-solicitudes"
  return "/admin"
}

export function HomeAccountActions({ initialUser }: { initialUser?: InitialUser | null }) {
  const { user, loading } = useAuth()
  const displayUser = user ?? (loading ? initialUser ?? null : null)

  if (loading && initialUser === undefined) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span className="h-5 w-5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <span className="hidden sm:inline">Cargando...</span>
      </div>
    )
  }

  if (!displayUser) {
    return (
      <Link href="/iniciar-sesion" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
        <KeyRound className="h-4 w-4" />
        Iniciar sesión
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <AuthSignOutButton initialAuthenticated />
      <UserAvatar initialUser={displayUser} href={getPanelHref(displayUser.app_metadata.role)} />
    </div>
  )
}
