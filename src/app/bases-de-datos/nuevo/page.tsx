"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Database, FileText, Building2 } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"

export default function NuevaBaseDeDatosPage() {
  const router = useRouter()
  const notifications = useNotifications()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        })
      })

      if (!res.ok) throw new Error('Failed to create')

      const data = await res.json()
      router.push(`/bases-de-datos/${data.id}`)
      router.refresh()
    } catch (error) {
      notifications.error("No se pudo crear", "Revisa los datos e intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/bases-de-datos" className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">Nueva Base de Datos</h1>
              <p className="text-xs text-slate-500">Crear catálogo bibliográfico</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
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
              {loading ? "Creando..." : "Crear Base de Datos"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
