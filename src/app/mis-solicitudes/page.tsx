"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Clock, RefreshCcw } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"

type MyLoan = {
  id: string
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
      detail: "Tu solicitud esta pendiente de aprobacion del equipo bibliotecario.",
    }
  }

  if (status === "active") {
    return {
      label: "Activo",
      badge: "bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-200",
      detail: "Prestamo aprobado y en curso.",
    }
  }

  if (status === "overdue") {
    return {
      label: "Vencido",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
      detail: "El prestamo esta fuera de termino.",
    }
  }

  if (status === "rejected") {
    return {
      label: "Rechazado",
      badge: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      detail: "La solicitud fue rechazada. Puedes volver a intentar mas tarde.",
    }
  }

  return {
    label: "Devuelto",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    detail: "Prestamo finalizado.",
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
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Volver al catalogo
          </Link>

          <button
            type="button"
            onClick={loadItems}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Mis solicitudes y prestamos</h1>
          <p className="text-slate-500">Aqui puedes ver el estado de cada solicitud enviada.</p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Cargando...
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">Aun no tienes solicitudes registradas.</p>
            <Link href="/" className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
              Ver catalogo
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
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                      <p className="text-xs text-slate-500">{author || "Autor no disponible"}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusUi.badge}`}>
                      {statusUi.label}
                    </span>
                  </div>

                  <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">{statusUi.detail}</p>

                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-3">
                    <div className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Solicitud: {new Date(loan.createdAt).toLocaleDateString("es-ES")}
                    </div>
                    <div>Inicio: {asDate(loan.loanDate) ? new Date(loan.loanDate).toLocaleDateString("es-ES") : "-"}</div>
                    <div>Vencimiento: {asDate(loan.dueDate) ? new Date(loan.dueDate).toLocaleDateString("es-ES") : "-"}</div>
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
