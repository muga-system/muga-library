"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, BookOpen, FileText, Building2, Tag, Hash, Trash2, AlertTriangle, Upload } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { useConfirm } from "@/components/confirm-provider"
import { createClient } from "@/lib/supabase/client"

interface Props {
  params: Promise<{ id: string; recordId: string }>
}

export default function EditarRegistroPage({ params }: Props) {
  const router = useRouter()
  const notifications = useNotifications()
  const { confirm } = useConfirm()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [databaseId, setDatabaseId] = useState<string>("")
  const [recordId, setRecordId] = useState<string>("")
  
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
    disponibles: 1,
    total_ejemplares: 1,
  })

  useEffect(() => {
    params.then(async (p) => {
      setDatabaseId(p.id)
      setRecordId(p.recordId)
      
      const res = await fetch(`/api/records/${p.recordId}`)
      const data = await res.json()

      if (data?.data) {
        setFormData({
          title: data.data.title || "",
          author: data.data.author || "",
          year: data.data.year || "",
          publisher: data.data.publisher || "",
          isbn: data.data.isbn || "",
          edition: data.data.edition || "",
          place: data.data.place || "",
          pages: data.data.pages || "",
          cdu: data.data.cdu || "",
          subject: data.data.subject || "",
          description: data.data.description || "",
          barcode: data.data.barcode || "",
          cover_url: data.data.cover_url || "",
          disponibles: data.data.disponibles || 1,
          total_ejemplares: data.data.total_ejemplares || 1,
        })
      }
    })
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
      const path = `${databaseId || "catalogo"}/${recordId || Date.now()}.${extension}`

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
      notifications.success("Portada cargada", "Guarda cambios para aplicar la nueva portada.")
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
      disponibles: formData.disponibles,
      total_ejemplares: formData.total_ejemplares,
    }

    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: recordData })
      })

      if (!res.ok) throw new Error('Failed to update')

      router.push(`/bases-de-datos/${databaseId}`)
    } catch (error) {
      notifications.error("No se pudo guardar", "Intenta nuevamente.")
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Eliminar registro",
      description: "Esta accion es permanente y no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) return
    
    setEliminando(true)
    
    try {
      const res = await fetch(`/api/records/${recordId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push(`/bases-de-datos/${databaseId}`)
    } catch (error) {
      notifications.error("No se pudo eliminar", "Verifica permisos e intenta otra vez.")
      setEliminando(false)
    }
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
              <h1 className="font-semibold text-slate-900">Editar Registro</h1>
              <p className="text-xs text-slate-500">Modificar datos del libro</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="5 (Ciencias Puras)"
                />
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
                  onChange={(e) => setFormData({ ...formData, total_ejemplares: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                placeholder="Notas sobre el material..."
              />
            </div>
          </div>

          <div className="flex gap-3">
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
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

        {/* Zona de peligro */}
        <div className="mt-12 p-6 bg-red-50 rounded-xl border border-red-200">
          <h3 className="font-medium text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Zona de Peligro
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Eliminar este registro es permanente. No se puede deshacer.
          </p>
          <button
            onClick={handleDelete}
            disabled={eliminando}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {eliminando ? "Eliminando..." : "Eliminar Registro"}
          </button>
        </div>
      </main>
    </div>
  )
}
