"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen, User } from "lucide-react"

interface Prestamo {
  id: string
  borrowerType: string
  borrowerName: string
  borrowerCourse?: string
  borrowerDivision?: string
  borrowerDepartment?: string
  loanDate: string
  dueDate: string
  returnDate?: string
  status: string
  notes?: string
  record?: {
    data: Record<string, unknown>
  }
}

function getEffectiveStatus(prestamo: Prestamo): "requested" | "active" | "overdue" | "returned" | "rejected" {
  if (prestamo.status === "active" && new Date(prestamo.dueDate) < new Date()) {
    return "overdue"
  }
  return prestamo.status as "requested" | "active" | "overdue" | "returned" | "rejected"
}

function renderStatusBadge(prestamo: Prestamo) {
  const status = getEffectiveStatus(prestamo)

  if (status === "requested") {
    return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">Pendiente</span>
  }

  if (status === "active") {
    return <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-slate-800 dark:text-slate-200">Activo</span>
  }

  if (status === "overdue") {
    return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">Vencido</span>
  }

  if (status === "rejected") {
    return <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">Rechazado</span>
  }

  return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-emerald-950/30 dark:text-emerald-300">Devuelto</span>
}

export default function HistorialPrestamosPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroTipo, setFiltroTipo] = useState("todos")

  useEffect(() => {
    loadPrestamos()
  }, [])

  async function loadPrestamos() {
    setLoading(true)
    try {
      const res = await fetch('/api/loans')
      const data = await res.json()
      setPrestamos(data)
    } catch (error) {
      console.error('Error loading loans:', error)
    }
    setLoading(false)
  }

  const prestamosFiltrados = prestamos.filter((p) => {
    const cumpleBusqueda = !busqueda || 
      p.borrowerName.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(p.record?.data?.title)?.toLowerCase().includes(busqueda.toLowerCase())
    
    const cumpleEstado = filtroEstado === "todos" || getEffectiveStatus(p) === filtroEstado
    const cumpleTipo = filtroTipo === "todos" || p.borrowerType === filtroTipo

    return cumpleBusqueda && cumpleEstado && cumpleTipo
  })

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/prestamos" className="rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-slate-100">Historial de Préstamos</h1>
              <p className="text-xs text-slate-500">Registro completo de todos los préstamos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Filtros */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o libro..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="todos">Todos los estados</option>
                <option value="requested">Pendientes</option>
                <option value="active">Activos</option>
                <option value="returned">Devueltos</option>
                <option value="overdue">Atrasados</option>
                <option value="rejected">Rechazados</option>
              </select>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="todos">Todos los tipos</option>
                <option value="student">Alumnos</option>
                <option value="teacher">Profesores</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : prestamosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No se encontraron préstamos</p>
            </div>
          ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-100 dark:border-white/20 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Libro</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Prestatario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Fecha Préstamo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Vencimiento</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Devolución</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/20">
                {prestamosFiltrados.map((prestamo) => {
                  return (
                    <tr key={prestamo.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900">{String(prestamo.record?.data?.title || "Sin título")}</div>
                        <div className="text-xs text-slate-500">{String(prestamo.record?.data?.author || "")}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{prestamo.borrowerName}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {prestamo.borrowerType === "student" ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {prestamo.borrowerCourse}{prestamo.borrowerDivision}
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-slate-200">{prestamo.borrowerDepartment || "Profesor"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(prestamo.loanDate).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(prestamo.dueDate).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {prestamo.returnDate 
                          ? new Date(prestamo.returnDate).toLocaleDateString("es-ES")
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(prestamo)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500">
          Total: {prestamosFiltrados.length} préstamo(s)
        </div>
      </main>
    </div>
  )
}

