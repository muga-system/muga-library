"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Building2, Check, Clock, Copy, Home, Mail, RefreshCcw, X } from "lucide-react"
import { MugaHeader } from "@/components/muga-header"
import { AuthSignOutButton } from "@/components/auth-signout-button"
import { UserAvatar } from "@/components/user-avatar"
import { useNotifications } from "@/components/notifications-provider"
import type { AuthUser } from "@/lib/auth/service"

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
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha no disponible"
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function AdminIncorporacionesPanel({ initialAuthenticated = false, initialUser }: { initialAuthenticated?: boolean; initialUser?: AuthUser | null }) {
  const notifications = useNotifications()
  const [requests, setRequests] = useState<CouponRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [approvedCoupon, setApprovedCoupon] = useState<ApprovedCoupon | null>(null)
  const [approvalRequest, setApprovalRequest] = useState<CouponRequest | null>(null)
  const [rejectionRequest, setRejectionRequest] = useState<CouponRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

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

  async function processRequest(request: CouponRequest, action: "approve" | "reject", adminNotes?: string): Promise<boolean> {
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
        if (body.emailSent !== false) {
          notifications.success("Solicitud rechazada", "Se envió el motivo al email de contacto.")
        } else {
          notifications.warning("Solicitud rechazada", "Se rechazó la solicitud, pero no se pudo enviar el email.")
        }
      }
      return true
    } catch (error) {
      notifications.error("No se pudo procesar", (error as Error).message)
      return false
    } finally {
      setProcessingId(null)
    }
  }

  async function confirmApproval() {
    if (!approvalRequest) return
    const approved = await processRequest(approvalRequest, "approve")
    if (approved) setApprovalRequest(null)
  }

  async function confirmRejection() {
    if (!rejectionRequest || !rejectionReason.trim()) return
    const rejected = await processRequest(rejectionRequest, "reject", rejectionReason.trim())
    if (rejected !== false) {
      setRejectionRequest(null)
      setRejectionReason("")
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
            <UserAvatar initialUser={initialUser} />
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
                            <button type="button" onClick={() => setApprovalRequest(request)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                              <Check className="h-3.5 w-3.5" />
                              Aprobar
                            </button>
                            <button type="button" onClick={() => { setRejectionRequest(request); setRejectionReason("") }} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
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

        {approvalRequest ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm" role="presentation">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="approve-request-title"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div>
                  <h2 id="approve-request-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Aprobar incorporación</h2>
                  <p className="mt-1 text-sm text-slate-500">Se generará un cupón y se enviará al email de {approvalRequest.libraryName}.</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                <p className="font-medium text-slate-800 dark:text-slate-200">{approvalRequest.libraryName}</p>
                <p className="mt-1 text-slate-500">{approvalRequest.email}</p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalRequest(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmApproval}
                  disabled={processingId === approvalRequest.id}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === approvalRequest.id ? "Aprobando..." : "Confirmar aprobación"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {rejectionRequest ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm" role="presentation">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-request-title"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/50">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-300" />
                  </div>
                  <div>
                    <h2 id="reject-request-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rechazar incorporación</h2>
                    <p className="mt-1 text-sm text-slate-500">Explicá el motivo para informárselo a {rejectionRequest.libraryName}.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setRejectionRequest(null); setRejectionReason("") }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Cerrar ventana"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label htmlFor="rejection-reason" className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300">Motivo del rechazo</label>
              <textarea
                id="rejection-reason"
                autoFocus
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Por ejemplo: necesitamos más información sobre la biblioteca..."
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setRejectionRequest(null); setRejectionReason("") }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  disabled={!rejectionReason.trim() || processingId === rejectionRequest.id}
                  className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === rejectionRequest.id ? "Rechazando..." : "Confirmar rechazo"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p>Al aprobar, el sistema envía el cupón al email de contacto. La biblioteca lo usa en <strong>/activar</strong> junto con su email y nombre exacto.</p>
        </div>
      </main>
    </div>
  )
}
