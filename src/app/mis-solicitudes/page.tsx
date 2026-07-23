"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Clock, RefreshCcw } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { MugaHeader } from "@/components/muga-header"

type MyLoan = {
  id: string
  recordId: string
  databaseName: string
  status: "requested" | "active" | "rejected" | "returned" | "overdue"
  loanDate: string
  dueDate: string
  returnDate?: string | null
  rejectionReason?: string | null
  createdAt: string
  record?: {
    data?: Record<string, unknown>
  } | null
}

function asDate(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getEffectiveStatus(loan: MyLoan): MyLoan["status"] {
  if (loan.status !== "active") return loan.status
  const due = asDate(loan.dueDate)
  if (!due) return loan.status
  return due < new Date() ? "overdue" : "active"
}

function getStatusUi(status: MyLoan["status"]) {
  if (status === "requested") {
    return {
      label: "Pendiente",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
      detail: "La biblioteca recibió tu solicitud y todavía debe revisarla.",
    }
  }

  if (status === "active") {
    return {
      label: "Aprobado",
      badge: "bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-200",
      detail: "La biblioteca aprobó el préstamo. Consultá con su equipo para coordinar el retiro.",
    }
  }

  if (status === "overdue") {
    return {
      label: "Vencido",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
      detail: "El préstamo está fuera de término. Contactá a la biblioteca para devolverlo.",
    }
  }

  if (status === "rejected") {
    return {
      label: "Rechazado",
      badge: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      detail: "La biblioteca rechazó la solicitud. Podés volver a intentarlo más adelante.",
    }
  }

  return {
    label: "Devuelto",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    detail: "Préstamo finalizado.",
  }
}

export default function MisSolicitudesPage() {
  const notifications = useNotifications()
  const [items, setItems] = useState<MyLoan[]>([])
  const [loading, setLoading] = useState(true)

  async function loadItems() {
    setLoading(true)
    try {
      const res = await fetch("/api/my/loans", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error("No se pudieron cargar tus solicitudes")
      setItems(Array.isArray(data) ? (data as MyLoan[]) : [])
    } catch (error) {
      notifications.error("Error al cargar", (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const orderedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [items])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Cuenta de lector"
        homeHref="/catalogo"
        navigation={<Link href="/catalogo" className="hover:text-slate-900 dark:hover:text-slate-200">Explorar catálogos</Link>}
        actions={<button type="button" onClick={loadItems} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCcw className="h-4 w-4" />Actualizar</button>}
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Mis préstamos</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Seguimiento de las solicitudes que enviaste a cada biblioteca.</p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Cargando...
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">Todavía no enviaste ninguna solicitud.</p>
            <Link href="/catalogo" className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
              Explorar catálogos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orderedItems.map((loan) => {
              const effectiveStatus = getEffectiveStatus(loan)
              const statusUi = getStatusUi(effectiveStatus)
              const title = String(loan.record?.data?.title || "Sin titulo")
              const author = String(loan.record?.data?.author || "")

              return (
                <article key={loan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="mb-1 text-xs text-slate-500">{loan.databaseName}</p>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100"><Link href={`/libro/${loan.recordId}`} className="hover:underline">{title}</Link></h2>
                      <p className="text-xs text-slate-500">{author || "Autor no disponible"}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusUi.badge}`}>
                      {statusUi.label}
                    </span>
                  </div>

                  <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">{statusUi.detail}</p>

                  <div className={`grid grid-cols-1 gap-2 text-xs text-slate-500 ${effectiveStatus === "requested" || effectiveStatus === "rejected" ? "" : "sm:grid-cols-3"}`}>
                    <div className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Solicitud: {new Date(loan.createdAt).toLocaleDateString("es-ES")}
                    </div>
                    {effectiveStatus !== "requested" && effectiveStatus !== "rejected" ? <div>Inicio: {asDate(loan.loanDate) ? new Date(loan.loanDate).toLocaleDateString("es-ES") : "-"}</div> : null}
                    {effectiveStatus !== "requested" && effectiveStatus !== "rejected" ? <div>Vencimiento: {asDate(loan.dueDate) ? new Date(loan.dueDate).toLocaleDateString("es-ES") : "-"}</div> : null}
                  </div>

                  {loan.returnDate ? (
                    <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                      Devuelto el {new Date(loan.returnDate).toLocaleDateString("es-ES")}
                    </div>
                  ) : null}

                  {effectiveStatus === "rejected" && loan.rejectionReason ? (
                    <div className="mt-2 rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      Motivo: {loan.rejectionReason}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
