"use client"

import Link from "next/link"

export function PublicLoanCta({
  recordId,
  available,
  isAuthenticated,
  userLoanStatus,
  rejectionReason,
}: {
  recordId: string
  available: number
  isAuthenticated: boolean
  userLoanStatus?: "requested" | "active" | "rejected" | "returned" | "overdue" | null
  rejectionReason?: string | null
}) {
  if (isAuthenticated && userLoanStatus === "requested") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
        Tu solicitud está pendiente de aprobación.
      </div>
    )
  }

  if (isAuthenticated && (userLoanStatus === "active" || userLoanStatus === "overdue")) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
        Ya tienes un préstamo activo de este libro.
      </div>
    )
  }

  if (isAuthenticated && userLoanStatus === "rejected") {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          Tu ultima solicitud fue rechazada.
          {rejectionReason ? (
            <span className="block text-xs text-slate-500 dark:text-slate-400">Motivo: {rejectionReason}</span>
          ) : null}
        </div>
        <Link href={`/solicitar/${recordId}`} className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Solicitar nuevamente
        </Link>
      </div>
    )
  }

  if (available <= 0) {
    return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">No hay ejemplares disponibles por ahora.</div>
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/iniciar-sesion?next=${encodeURIComponent(`/solicitar/${recordId}`)}`}
        className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      >
        Iniciar sesión para solicitar préstamo
      </Link>
    )
  }

  return (
    <Link href={`/solicitar/${recordId}`} className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
      Solicitar préstamo
    </Link>
  )
}
