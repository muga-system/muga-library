"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Database, Trash2, AlertTriangle } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { useConfirm } from "@/components/confirm-provider"

interface Props {
  params: Promise<{ id: string }>
}

export default function EditarBaseDeDatosPage({ params }: Props) {
  const router = useRouter()
  const notifications = useNotifications()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(false)
  const [databaseId, setDatabaseId] = useState<string>("")
  const [eliminando, setEliminando] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    params.then(p => {
      setDatabaseId(p.id)
      loadDatabase(p.id)
    })
  }, [])

  async function loadDatabase(id: string) {
    try {
      const res = await fetch(`/api/databases/${id}`)
      const data = await res.json()
      if (data) {
        setFormData({
          name: data.name,
          description: data.description || "",
        })
      }
    } catch (error) {
      console.error('Error loading database:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        })
      })

      if (!res.ok) throw new Error('Failed to update')

      router.push("/bases-de-datos")
      router.refresh()
    } catch (error) {
      notifications.error("No se pudo guardar", "Intenta nuevamente en unos segundos.")
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Eliminar base de datos",
      description: "Se eliminaran permanentemente todos los registros asociados. Esta accion no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) {
      return
    }

    setEliminando(true)

    try {
      const res = await fetch(`/api/databases/${databaseId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push("/bases-de-datos")
    } catch (error) {
      notifications.error("No se pudo eliminar", "Verifica permisos e intenta otra vez.")
      setEliminando(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/bases-de-datos" className="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">Editar Base de Datos</h1>
              <p className="text-xs text-slate-500">Modificar información del catálogo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Información del Catálogo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Nombre del catálogo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  placeholder="Descripción opcional del catálogo..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link 
              href="/bases-de-datos"
              className="flex-1 px-4 py-2.5 text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

        {/* Zona de peligro */}
        <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <h3 className="mb-4 flex items-center gap-2 font-medium text-red-900 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            Zona de Peligro
          </h3>
          <p className="mb-4 text-sm text-red-700 dark:text-red-300/90">
            Eliminar esta base de datos eliminará permanentemente todos los registros asociados. 
            Esta acción no se puede deshacer.
          </p>
          <button
            onClick={handleDelete}
            disabled={eliminando}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
            {eliminando ? "Eliminando..." : "Eliminar Base de Datos"}
          </button>
        </div>
      </main>
    </div>
  )
}
