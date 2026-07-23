"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/components/notifications-provider"

export function PublicLoanForm({
  recordId,
  databaseId,
  accountEmail,
}: {
  recordId: string
  databaseId: string
  accountEmail: string
}) {
  const router = useRouter()
  const notifications = useNotifications()
  const [loading, setLoading] = useState(false)
  const [borrowerType, setBorrowerType] = useState<"reader" | "student" | "teacher">("reader")
  const [borrowerName, setBorrowerName] = useState("")
  const [borrowerCourse, setBorrowerCourse] = useState("")
  const [borrowerDivision, setBorrowerDivision] = useState("")
  const [borrowerDepartment, setBorrowerDepartment] = useState("")
  const [notes, setNotes] = useState("")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        record_id: recordId,
        database_id: databaseId,
        borrower_type: borrowerType,
        borrower_name: borrowerName.trim(),
        borrower_course: borrowerType === "student" ? borrowerCourse || undefined : undefined,
        borrower_division: borrowerType === "student" ? borrowerDivision || undefined : undefined,
        borrower_department: borrowerType === "teacher" ? borrowerDepartment || undefined : undefined,
        notes: notes || undefined,
        public_request: true,
      }

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "No se pudo registrar la solicitud")
      }

      notifications.success("Préstamo solicitado", "Tu solicitud fue registrada correctamente.")
      router.push(`/libro/${recordId}?solicitud=ok`)
      router.refresh()
    } catch (error) {
      notifications.error("No se pudo solicitar el préstamo", (error as Error)?.message || "Intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
        <p className="text-xs text-slate-500">Cuenta que realiza la solicitud</p>
        <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{accountEmail}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Nombre y apellido</label>
        <input
          required
          value={borrowerName}
          onChange={(e) => setBorrowerName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Relación con la biblioteca</label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <label className="inline-flex items-center gap-2"><input type="radio" checked={borrowerType === "reader"} onChange={() => setBorrowerType("reader")} /> Lector/a</label>
          <label className="inline-flex items-center gap-2"><input type="radio" checked={borrowerType === "student"} onChange={() => setBorrowerType("student")} /> Estudiante</label>
          <label className="inline-flex items-center gap-2"><input type="radio" checked={borrowerType === "teacher"} onChange={() => setBorrowerType("teacher")} /> Docente</label>
        </div>
      </div>

      {borrowerType === "student" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Curso</label>
            <input value={borrowerCourse} onChange={(e) => setBorrowerCourse(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">División</label>
            <input value={borrowerDivision} onChange={(e) => setBorrowerDivision(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
      ) : borrowerType === "teacher" ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Departamento</label>
          <input value={borrowerDepartment} onChange={(e) => setBorrowerDepartment(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Observaciones (opcional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
      </div>

      <button disabled={loading} className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50">
        {loading ? "Enviando..." : "Confirmar solicitud"}
      </button>
    </form>
  )
}
