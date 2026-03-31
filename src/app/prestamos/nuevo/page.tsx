"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Search, BookOpen, User, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"

interface Libro {
  id: string
  databaseId: string
  disponibles: number
  totalEjemplares: number
  data: Record<string, unknown>
}

const cursos = ["1", "2", "3", "4", "5", "6"]
const divisiones = ["A", "B", "C", "D"]

export default function NuevoPrestamoPage() {
  const router = useRouter()
  const notifications = useNotifications()
  const [preloadedRecordId, setPreloadedRecordId] = useState("")
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [libros, setLibros] = useState<Libro[]>([])
  const [libroSeleccionado, setLibroSeleccionado] = useState<Libro | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)

  const [prestamo, setPrestamo] = useState({
    borrowerType: "student" as "student" | "teacher",
    borrowerName: "",
    borrowerCourse: "",
    borrowerDivision: "",
    borrowerDepartment: "",
    notes: "",
  })

  useEffect(() => {
    if (busqueda.length >= 2) {
      buscarLibros()
    } else {
      setLibros([])
    }
  }, [busqueda])

  useEffect(() => {
    if (typeof window === "undefined") return
    const recordId = new URLSearchParams(window.location.search).get("recordId") || ""
    setPreloadedRecordId(recordId)
  }, [])

  useEffect(() => {
    const recordId = preloadedRecordId
    if (!recordId) return

    async function preloadRecord() {
      try {
        const res = await fetch(`/api/records/${recordId}`)
        const data = await res.json()
        if (!res.ok) return

        const preloaded: Libro = {
          id: data.id,
          databaseId: data.databaseId ?? data.database_id,
          disponibles: Number(data.disponibles ?? 0),
          totalEjemplares: Number(data.totalEjemplares ?? data.total_ejemplares ?? 1),
          data: data.data ?? {},
        }

        setLibroSeleccionado(preloaded)
        setBusqueda(String(preloaded.data?.title || ""))
        setMostrarResultados(false)
      } catch (error) {
        console.error("Error preloading record:", error)
      }
    }

    preloadRecord()
  }, [preloadedRecordId])

  async function buscarLibros() {
    try {
      const res = await fetch(`/api/records?q=${encodeURIComponent(busqueda)}&limit=10`)
      const payload = await res.json()
      const data = Array.isArray(payload)
        ? payload.map((item: any) => ({
            id: item.id,
            databaseId: item.databaseId ?? item.database_id,
            disponibles: Number(item.disponibles ?? 0),
            totalEjemplares: Number(item.totalEjemplares ?? item.total_ejemplares ?? 1),
            data: item.data ?? {},
          }))
        : []

      setLibros(data)
      setMostrarResultados(true)
    } catch (error) {
      console.error('Error searching books:', error)
    }
  }

  function seleccionarLibro(libro: Libro) {
    setLibroSeleccionado(libro)
    setBusqueda(String(libro.data?.title || ""))
    setMostrarResultados(false)
    setLibros([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!libroSeleccionado) {
      notifications.warning("Falta seleccionar libro")
      return
    }
    if (!prestamo.borrowerName) {
      notifications.warning("Falta nombre del prestatario")
      return
    }

    if (Number(libroSeleccionado.disponibles || 0) <= 0) {
      notifications.warning("Sin ejemplares disponibles", "Selecciona otro libro o registra una devolucion.")
      return
    }

    if (!libroSeleccionado.databaseId) {
      notifications.error("Libro invalido", "El libro seleccionado no tiene catalogo asociado.")
      return
    }

    setLoading(true)

    try {
      const payload = {
        record_id: libroSeleccionado.id,
        database_id: libroSeleccionado.databaseId,
        borrower_type: prestamo.borrowerType,
        borrower_name: prestamo.borrowerName.trim(),
        borrower_course: prestamo.borrowerType === "student" ? (prestamo.borrowerCourse || undefined) : undefined,
        borrower_division: prestamo.borrowerType === "student" ? (prestamo.borrowerDivision || undefined) : undefined,
        borrower_department: prestamo.borrowerType === "teacher" ? (prestamo.borrowerDepartment || undefined) : undefined,
        notes: prestamo.notes || undefined,
      }

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || body?.message || 'Failed to create loan')
      }

      router.push("/prestamos")
    } catch (error) {
      notifications.error("No se pudo registrar el prestamo", (error as Error)?.message || "Intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/prestamos" className="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">Nuevo Préstamo</h1>
              <p className="text-xs text-slate-500">Registrar préstamo de libro</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buscar Libro */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Seleccionar Libro
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => busqueda.length >= 2 && setMostrarResultados(true)}
                placeholder="Buscar por título, autor o ISBN..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {mostrarResultados && libros.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {libros.map((libro) => (
                  <button
                    key={libro.id}
                    type="button"
                    onClick={() => seleccionarLibro(libro)}
                    className="w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100">{String(libro.data?.title || "Sin título")}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-300">{String(libro.data?.author || "")}</div>
                    <div className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                      Disponibles: {libro.disponibles} / {libro.totalEjemplares}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {libroSeleccionado && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-emerald-300" />
                <div className="flex-1">
                  <div className="font-medium text-green-900 dark:text-emerald-200">{String(libroSeleccionado.data?.title || "")}</div>
                  <div className="text-sm text-green-700 dark:text-emerald-300/90">
                    Disponibles: {libroSeleccionado.disponibles}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Datos del Prestatario */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos del Prestatario
            </h3>

            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de prestatario</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo"
                      checked={prestamo.borrowerType === "student"}
                      onChange={() => setPrestamo({ ...prestamo, borrowerType: "student" })}
                      className="text-slate-900"
                    />
                    <span className="text-sm text-slate-700">Alumno</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo"
                      checked={prestamo.borrowerType === "teacher"}
                      onChange={() => setPrestamo({ ...prestamo, borrowerType: "teacher" })}
                      className="text-slate-900"
                    />
                    <span className="text-sm text-slate-700">Profesor</span>
                  </label>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={prestamo.borrowerName}
                  onChange={(e) => setPrestamo({ ...prestamo, borrowerName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Nombre y apellido"
                />
              </div>

              {/* Curso y División - Solo Alumnos */}
              {prestamo.borrowerType === "student" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Año/Curso</label>
                    <select
                      value={prestamo.borrowerCourse}
                      onChange={(e) => setPrestamo({ ...prestamo, borrowerCourse: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="">Seleccionar...</option>
                      {cursos.map((c) => (
                        <option key={c} value={c}>{c}° Año</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">División</label>
                    <select
                      value={prestamo.borrowerDivision}
                      onChange={(e) => setPrestamo({ ...prestamo, borrowerDivision: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="">Seleccionar...</option>
                      {divisiones.map((d) => (
                        <option key={d} value={d}>División {d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Departamento - Solo Profesores */}
              {prestamo.borrowerType === "teacher" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Departamento</label>
                  <input
                    type="text"
                    value={prestamo.borrowerDepartment}
                    onChange={(e) => setPrestamo({ ...prestamo, borrowerDepartment: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                    placeholder="Departamento o área"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4">Observaciones</h3>
            <textarea
              rows={3}
              value={prestamo.notes}
              onChange={(e) => setPrestamo({ ...prestamo, notes: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Info de vencimiento */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="text-sm text-blue-800">
              El préstamo tendrá una duración de <strong>7 días</strong>. 
              La fecha de vencimiento se calculará automáticamente.
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Link 
              href="/prestamos"
              className="flex-1 px-4 py-2.5 text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? "Registrando..." : "Registrar Préstamo"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

