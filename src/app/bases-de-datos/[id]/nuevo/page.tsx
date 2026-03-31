"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, BookOpen, FileText, Building2, Tag, Hash, Upload } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { createClient } from "@/lib/supabase/client"

export default function NuevoRegistroPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const notifications = useNotifications()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [databaseId, setDatabaseId] = useState<string>("")
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    publisher: "",
    isbn: "",
    edition: "",
    place: "",
    pages: "",
    cdu: "",
    subject: "",
    description: "",
    barcode: "",
    cover_url: "",
    total_ejemplares: 1,
    disponibles: 1,
  })

  useEffect(() => {
    params.then(p => setDatabaseId(p.id))
  }, [])

  async function handleCoverUpload(file: File) {
    const mime = file.type.toLowerCase()
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      notifications.warning("Formato no soportado", "Sube una imagen JPG, PNG o WEBP.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notifications.warning("Archivo muy grande", "La portada debe pesar menos de 5MB.")
      return
    }

    setUploadingCover(true)
    try {
      const extension = file.name.split(".").pop() || "jpg"
      const path = `${databaseId || "catalogo"}/${Date.now()}.${extension}`

      let uploadResult = await supabase.storage
        .from("book-covers")
        .upload(path, file, { upsert: true })

      if (uploadResult.error?.message?.toLowerCase().includes("bucket not found")) {
        const ensureBucket = await fetch('/api/storage/book-covers-bucket', { method: 'POST' })
        if (ensureBucket.ok) {
          uploadResult = await supabase.storage
            .from("book-covers")
            .upload(path, file, { upsert: true })
        }
      }

      if (uploadResult.error) throw uploadResult.error

      const { data } = supabase.storage.from("book-covers").getPublicUrl(path)
      if (!data?.publicUrl) throw new Error("No se pudo obtener URL")

      setFormData((prev) => ({ ...prev, cover_url: data.publicUrl }))
      notifications.success("Portada cargada", "Guarda el registro para aplicar cambios.")
    } catch (error) {
      notifications.error("No se pudo subir la portada", "Verifica bucket y permisos de Storage.")
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const recordData = {
      title: formData.title,
      author: formData.author,
      year: formData.year,
      publisher: formData.publisher,
      isbn: formData.isbn,
      edition: formData.edition,
      place: formData.place,
      pages: formData.pages,
      cdu: formData.cdu,
      subject: formData.subject,
      description: formData.description,
      barcode: formData.barcode,
      cover_url: formData.cover_url,
      total_ejemplares: formData.total_ejemplares,
      disponibles: formData.disponibles,
    }

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_id: databaseId,
          data: recordData,
          total_ejemplares: recordData.total_ejemplares,
          disponibles: recordData.disponibles,
        })
      })

      if (!res.ok) throw new Error('Failed to create')

      router.push(`/bases-de-datos/${databaseId}`)
    } catch (error) {
      notifications.error("No se pudo guardar", "Intenta nuevamente.")
      setLoading(false)
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/bases-de-datos/${databaseId}`} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">Nuevo Registro</h1>
              <p className="text-xs text-slate-500">Agregar libro al catálogo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
          <form onSubmit={handleSubmit}>
            <div className="mb-6 bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-medium text-slate-900">
                <Upload className="h-4 w-4" />
                Portada del libro
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,180px]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">URL de portada</label>
                  <input
                    type="url"
                    value={formData.cover_url}
                    onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                  />
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <Upload className="h-4 w-4" />
                    {uploadingCover ? "Subiendo..." : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingCover}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) handleCoverUpload(file)
                        event.currentTarget.value = ""
                      }}
                    />
                  </label>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {formData.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.cover_url} alt="Previsualizacion portada" className="aspect-[3/4] h-full w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center text-xs text-slate-500">Sin portada</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Ejemplares
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Total de Ejemplares
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_ejemplares}
                  onChange={(e) => setFormData({ ...formData, total_ejemplares: parseInt(e.target.value) || 1, disponibles: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Disponibles para Préstamo
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.total_ejemplares}
                  value={formData.disponibles}
                  onChange={(e) => setFormData({ ...formData, disponibles: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Datos Principales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Título del libro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Autor(es)
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Apellido, Nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Año de Publicación
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="2024"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Editorial y Edición
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Editorial
                </label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Nombre de editorial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lugar de Publicación
                </label>
                <input
                  type="text"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Ciudad, País"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Edición
                </label>
                <input
                  type="text"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="1ra. edición"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Identificadores
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="978-3-16-148410-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Código interno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Número de Páginas
                </label>
                <input
                  type="text"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="256 p."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Clasificación CDU
                </label>
                <input
                  type="text"
                  value={formData.cdu}
                  onChange={(e) => setFormData({ ...formData, cdu: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="5 (Ciencias Puras)"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Clasificación y Materias
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Materias / Palabras Clave
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="Separadas por coma"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripción / Notas
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                placeholder="Notas sobre el material..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link 
              href={`/bases-de-datos/${databaseId}`}
              className="flex-1 px-4 py-2.5 text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={loading || !formData.title}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
