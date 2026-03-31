import Link from "next/link"
import { ArrowLeft, Plus, Clock, AlertTriangle, BookOpen, User, CheckCircle, History } from "lucide-react"
import { getAllLoans, getLoanStats } from "@/lib/services/database"

async function getPrestamosStats() {
  try {
    return await getLoanStats()
  } catch {
    return { requested: 0, active: 0, overdue: 0, returned: 0 }
  }
}

function getEffectiveStatus(prestamo: any): "requested" | "active" | "overdue" | "returned" | "rejected" {
  if (prestamo.status === "active" && prestamo.dueDate < new Date().toISOString().split("T")[0]) {
    return "overdue"
  }
  return prestamo.status
}

function renderStatusBadge(prestamo: any) {
  const status = getEffectiveStatus(prestamo)

  if (status === "requested") {
    return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">Pendiente</span>
  }

  if (status === "active") {
    return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">Activo</span>
  }

  if (status === "overdue") {
    return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">Vencido</span>
  }

  if (status === "rejected") {
    return <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-700 rounded">Rechazado</span>
  }

  return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Devuelto</span>
}

async function getPrestamosRecientes() {
  try {
    const loans = await getAllLoans()
    return loans.slice(0, 10)
  } catch {
    return []
  }
}

async function getPrestamosVencidos() {
  try {
    const loans = await getAllLoans('active')
    const hoy = new Date().toISOString().split('T')[0]
    return loans.filter((l: any) => l.dueDate < hoy).slice(0, 5)
  } catch {
    return []
  }
}

export default async function PrestamosPage() {
  const stats = await getPrestamosStats()
  const recientes = await getPrestamosRecientes()
  const vencidos = await getPrestamosVencidos()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">Préstamos</h1>
                  <p className="text-xs text-slate-500">Gestión de préstamos bibliotecarios</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/prestamos/historial"
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <History className="h-4 w-4" />
                Historial
              </Link>
              <Link 
                href="/prestamos/nuevo"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Préstamo
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10 md:grid-cols-4">
          <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-700">Pendientes</span>
            </div>
            <div className="text-3xl font-semibold text-amber-800">{stats.requested}</div>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-slate-600" />
              <span className="text-sm text-slate-500">Préstamos Activos</span>
            </div>
            <div className="text-3xl font-semibold text-slate-900">{stats.active}</div>
          </div>
          
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
              <span className="text-sm text-red-600 dark:text-red-300">Vencidos</span>
            </div>
            <div className="text-3xl font-semibold text-red-700 dark:text-red-200">{stats.overdue}</div>
          </div>
          
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-emerald-300" />
              <span className="text-sm text-green-600 dark:text-emerald-300">Devueltos</span>
            </div>
            <div className="text-3xl font-semibold text-green-700 dark:text-emerald-200">{stats.returned}</div>
          </div>
        </div>

        {/* Vencidos */}
        {vencidos.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Préstamos Vencidos
            </h2>
            <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-red-100 border-b border-red-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-red-700 uppercase">Libro</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-red-700 uppercase">Prestatario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-red-700 uppercase">Vencimiento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-red-700 uppercase">Días de atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200 dark:divide-white/20">
                  {vencidos.map((prestamo: any) => {
                    const diasAtraso = Math.floor((new Date().getTime() - new Date(prestamo.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={prestamo.id}>
                        <td className="px-4 py-3 text-sm text-slate-900">{prestamo.records?.data?.title || "Sin título"}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{prestamo.borrowerName}</td>
                        <td className="px-4 py-3 text-sm text-red-600">{new Date(prestamo.dueDate).toLocaleDateString("es-ES")}</td>
                        <td className="px-4 py-3 text-sm font-medium text-red-700">{diasAtraso} días</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recientes */}
        <div>
          <h2 className="text-lg font-medium text-slate-900 mb-4">Préstamos Recientes</h2>
          {recientes.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No hay préstamos registrados</p>
              <Link href="/prestamos/nuevo" className="text-sm font-medium text-slate-900 hover:underline">
                Registrar primer préstamo →
              </Link>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Libro</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Prestatario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Fecha Préstamo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Vencimiento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/20">
                  {recientes.map((prestamo: any) => (
                    <tr key={prestamo.id} className="hover:bg-slate-100">
                      <td className="px-4 py-3 text-sm text-slate-900">{prestamo.records?.data?.title || "Sin título"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{prestamo.borrowerName}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {prestamo.borrowerType === "student" && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {prestamo.borrowerCourse}{prestamo.borrowerDivision}
                          </span>
                        )}
                        {prestamo.borrowerType === "teacher" && (
                          <span className="text-blue-600">Profesor</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(prestamo.loanDate).toLocaleDateString("es-ES")}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(prestamo.dueDate).toLocaleDateString("es-ES")}</td>
                      <td className="px-4 py-3">{renderStatusBadge(prestamo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

