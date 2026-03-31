"use client"

import Link from "next/link"
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <h1 className="mb-3 text-2xl font-semibold">No pudimos conectar la aplicacion</h1>
      <p className="mb-6 text-slate-600">
        Puede ser un problema de autenticacion o de conexion con la base de datos.
        Revisa variables de entorno y estado de Supabase.
      </p>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
        <Link
          href="/iniciar-sesion"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
        >
          <ShieldCheck className="h-4 w-4" />
          Ir a iniciar sesion
        </Link>
      </div>

      <p className="text-xs text-slate-500">{error?.message || "Error desconocido"}</p>
    </main>
  )
}