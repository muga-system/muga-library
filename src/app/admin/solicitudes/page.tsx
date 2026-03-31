"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, X, Clock, RefreshCcw } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"

type PendingLoan = {
  id: string
  borrowerName: string
  borrowerType: "student" | "teacher"
  borrowerCourse?: string
  borrowerDivision?: string
  borrowerDepartment?: string
  notes?: string
  createdAt: string
  record?: {
    data?: Record<string, unknown>
  } | null
}

function getBookTitle(loan: PendingLoan): string {
  return String(loan.record?.data?.title || "Sin titulo")
}

function getBookAuthor(loan: PendingLoan): string {
  return String(loan.record?.data?.author || "")
}

function getBorrowerLabel(loan: PendingLoan): string {
  if (loan.borrowerType === "student") {
    const course = String(loan.borrowerCourse || "")
    const division = String(loan.borrowerDivision || "")
    const grade = `${course}${division}`.trim()
    return grade ? `Alumno ${grade}` : "Alumno"
  }

  return loan.borrowerDepartment ? `Profesor - ${loan.borrowerDepartment}` : "Profesor"
}

export default function AdminSolicitudesPage() {
  const notifications = useNotifications()
  const [items, setItems] = useState<PendingLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function loadQueue() {
    setLoading(true)
    try {
      const res = await fetch("/api/loans?status=requested", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error("No se pudieron cargar las solicitudes")
      setItems(Array.isArray(data) ? (data as PendingLoan[]) : [])
    } catch (error) {
      notifications.error("Error al cargar", (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  async function approve(id: string) {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/loans/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "No se pudo aprobar la solicitud")
      setItems((prev) => prev.filter((item) => item.id !== id))
      notifications.success("Solicitud aprobada")
    } catch (error) {
      notifications.error("No se pudo aprobar", (error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  async function reject(id: string) {
    const reason = window.prompt("Motivo de rechazo (opcional)") || ""

    setProcessingId(id)
    try {
      const res = await fetch(`/api/loans/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: reason.trim() || undefined }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "No se pudo rechazar la solicitud")
      setItems((prev) => prev.filter((item) => item.id !== id))
      notifications.success("Solicitud rechazada")
    } catch (error) {
      notifications.error("No se pudo rechazar", (error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  const hasItems = useMemo(() => items.length > 0, [items])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Volver al admin
            </Link>
          </div>

          <button
            type="button"
            onClick={loadQueue}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Solicitudes pendientes</h1>
          <p className="text-slate-500">Aprobar o rechazar solicitudes publicas antes de activar el prestamo.</p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Cargando solicitudes...
          </div>
        ) : !hasItems ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Clock className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-100 dark:border-white/20 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Libro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/20">
                {items.map((loan) => {
                  const busy = processingId === loan.id
                  return (
                    <tr key={loan.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{getBookTitle(loan)}</div>
                        <div className="text-xs text-slate-500">{getBookAuthor(loan)}</div>
                        {loan.notes ? <div className="mt-1 text-xs text-slate-500">Nota: {loan.notes}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        <div>{loan.borrowerName}</div>
                        <div className="text-xs text-slate-500">{getBorrowerLabel(loan)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(loan.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approve(loan.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(loan.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
