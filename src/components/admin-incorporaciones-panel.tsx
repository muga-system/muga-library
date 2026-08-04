"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Check, Clock, Copy, Home, Mail, RefreshCcw, X } from "lucide-react"
import { MugaHeader } from "@/components/muga-header"
import { AuthSignOutButton } from "@/components/auth-signout-button"
import { useNotifications } from "@/components/notifications-provider"

type CouponRequest = {
  id: string
  email: string
  libraryName: string
  description?: string | null
  status: string
  requestedAt: string
}

type ApprovedCoupon = {
  code: string
  email: string
  libraryName: string
  emailSent: boolean
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function AdminIncorporacionesPanel({ initialAuthenticated = false }: { initialAuthenticated?: boolean }) {
  const notifications = useNotifications()
  const [requests, setRequests] = useState<CouponRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [approvedCoupon, setApprovedCoupon] = useState<ApprovedCoupon | null>(null)

  async function loadRequests() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/coupon-requests?status=pending", { cache: "no-store" })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || "No se pudieron cargar las solicitudes")
      setRequests(Array.isArray(body.requests) ? body.requests : [])
    } catch (error) {
      notifications.error("Error al cargar", (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function processRequest(request: CouponRequest, action: "approve" | "reject") {
    if (action === "approve" && !window.confirm(`¿Aprobar la incorporación de ${request.libraryName}?`)) return

    const adminNotes = action === "reject"
      ? window.prompt("Motivo del rechazo (opcional)")?.trim() || undefined
      : undefined

    setProcessingId(request.id)
    try {
      const response = await fetch("/api/admin/coupon-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes, requestId: request.id }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || "No se pudo procesar la solicitud")

      setRequests((current) => current.filter((item) => item.id !== request.id))

      if (action === "approve" && body.coupon?.code) {
        const coupon = {
          code: body.coupon.code,
          email: request.email,
          libraryName: request.libraryName,
          emailSent: body.emailSent !== false,
        }
        setApprovedCoupon(coupon)
        if (coupon.emailSent) {
          notifications.success("Solicitud aprobada", "El cupón fue enviado al email de contacto.")
        } else {
          notifications.warning("Solicitud aprobada", "El cupón se generó, pero el email no pudo enviarse.")
        }
      } else {
        notifications.success("Solicitud rechazada")
      }
    } catch (error) {
      notifications.error("No se pudo procesar", (error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  async function copyCoupon() {
    if (!approvedCoupon) return
    await navigator.clipboard.writeText(approvedCoupon.code)
    notifications.success("Cupón copiado")
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        title="Administración"
        subtitle="Solicitudes de bibliotecas"
        homeHref="/"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={loadRequests}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Home className="h-4 w-4" />
              Inicio
            </Link>
            <AuthSignOutButton initialAuthenticated={initialAuthenticated} />
          </div>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">Acceso de bibliotecas</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Solicitudes de incorporación</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Aprobá una solicitud para generar el cupón que permitirá crear el usuario y el catálogo de la biblioteca.</p>
        </div>

        {approvedCoupon ? (
          <section className={`mb-8 rounded-xl border p-5 ${approvedCoupon.emailSent ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Check className={`h-5 w-5 ${approvedCoupon.emailSent ? "text-emerald-600" : "text-amber-600"}`} />
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">Cupón generado para {approvedCoupon.libraryName}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {approvedCoupon.emailSent ? `Enviado a ${approvedCoupon.email}.` : `No se pudo enviar a ${approvedCoupon.email}; podés copiarlo y compartirlo manualmente.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold tracking-wider text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{approvedCoupon.code}</code>
                <button type="button" onClick={copyCoupon} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">Cargando solicitudes...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Clock className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="font-medium text-slate-700 dark:text-slate-200">No hay solicitudes pendientes.</p>
            <p className="mt-1 text-sm text-slate-500">Las nuevas solicitudes aparecerán acá.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Biblioteca</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Contacto</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Descripción</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Fecha</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {requests.map((request) => {
                    const busy = processingId === request.id
                    return (
                      <tr key={request.id} className="bg-white align-top hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{request.libraryName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{request.email}</td>
                        <td className="max-w-xs px-5 py-4 text-sm text-slate-500">{request.description || "Sin descripción"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{formatDate(request.requestedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => processRequest(request, "approve")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                              <Check className="h-3.5 w-3.5" />
                              Aprobar
                            </button>
                            <button type="button" onClick={() => processRequest(request, "reject")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
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
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p>Al aprobar, el sistema envía el cupón al email de contacto. La biblioteca lo usa en <strong>/activar</strong> junto con su email y nombre exacto.</p>
        </div>
      </main>
    </div>
  )
}
