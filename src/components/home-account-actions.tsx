"use client"

import Link from "next/link"
import { KeyRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type InitialUser = {
  email: string
  app_metadata: { role: string }
}

function getInitial(email: string) {
  return email.trim().charAt(0).toUpperCase() || "U"
}

function getPanelHref(role: string) {
  if (role === "reader") return "/mis-solicitudes"
  return "/admin"
}

export function HomeAccountActions({ initialUser }: { initialUser?: InitialUser | null }) {
  const { user, loading } = useAuth()
  const displayUser = loading ? initialUser ?? null : user

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
    <Link
      href={getPanelHref(displayUser.app_metadata.role)}
      title="Abrir mi panel"
      className="inline-flex max-w-[15rem] items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-700">
        {getInitial(displayUser.email)}
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400">Sesión activa</span>
        <span className="block truncate text-xs text-slate-700 dark:text-slate-200">{displayUser.email}</span>
      </span>
    </Link>
  )
}
