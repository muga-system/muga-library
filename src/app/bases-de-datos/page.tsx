"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Database, ArrowLeft, Search, Pencil, Trash2, MoreVertical } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { useConfirm } from "@/components/confirm-provider"

interface DatabaseItem {
  id: string
  name: string
  description: string | null
  createdAt: string
  records_count?: number
}

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export const dynamic = 'force-dynamic'

export default function BasesDeDatosPage() {
  const notifications = useNotifications()
  const { confirm } = useConfirm()
  const [databases, setDatabases] = useState<DatabaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-row-menu-root="true"]')) return
      setMenuOpen(null)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])

  useEffect(() => {
    loadDatabases()
  }, [])

  async function loadDatabases() {
    try {
      const res = await fetch('/api/databases')
      const data = await res.json()
      if (Array.isArray(data)) {
        setDatabases(data)
      } else {
        setDatabases([])
      }
    } catch (error) {
      console.error('Error loading databases:', error)
      setDatabases([])
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: "Eliminar base de datos",
      description: `Se eliminara "${name}" junto con todos sus registros asociados.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) {
      return
    }

    try {
      const res = await fetch(`/api/databases/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      loadDatabases()
    } catch (error) {
      notifications.error("No se pudo eliminar", "Verifica permisos e intenta otra vez.")
    }
    setMenuOpen(null)
  }

  const filteredDatabases = databases.filter(db => 
    db.name.toLowerCase().includes(search.toLowerCase()) ||
    db.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Bases de Datos</h1>
                <p className="text-xs text-slate-500">Gestión de catálogos bibliográficos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/bases-de-datos/nuevo"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva Base de Datos
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bases de datos..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : filteredDatabases.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No hay bases de datos todavía
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Crea tu primera base de datos bibliográfica para comenzar a gestionar el catálogo de tu biblioteca.
            </p>
            <Link 
              href="/bases-de-datos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Base de Datos
            </Link>
          </div>
        ) : (
          <div className="relative overflow-visible bg-slate-50 rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200 dark:border-white/20">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Nombre</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Descripción</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Registros</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Fecha</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/20">
                {filteredDatabases.map((db) => {
                  const slug = toSlug(db.name)
                  return (
                    <tr key={db.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/70">
                      <td className="px-6 py-4">
                        <Link href={`/bases-de-datos/${slug}`} className="font-medium text-slate-900 hover:text-slate-600">
                          {db.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {db.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {db.records_count || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(db.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-6 py-4 text-right overflow-visible">
                        <div className="relative" data-row-menu-root="true">
                          <button
                            onClick={() => setMenuOpen(menuOpen === db.id ? null : db.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              menuOpen === db.id
                                ? "bg-slate-300 text-slate-700 dark:bg-slate-600/80 dark:text-slate-100"
                                : "text-slate-500 hover:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-600/70"
                            }`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpen === db.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-[1300] dark:border-slate-700 dark:bg-slate-900">
                              <Link
                                href={`/bases-de-datos/${slug}/editar`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Link>
                              <button
                                onClick={() => handleDelete(db.id, db.name)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </button>
                            </div>
                          )}
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
