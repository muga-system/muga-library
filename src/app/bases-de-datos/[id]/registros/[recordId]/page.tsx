import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, User, Calendar, MapPin, Building2, Hash, Tag, BookOpen, Edit } from "lucide-react"
import { getRecordById, getDatabaseById } from "@/lib/services/database"

async function getRecord(databaseId: string, recordId: string) {
  const record = await getRecordById(recordId)
  const database = await getDatabaseById(databaseId)
  return record ? { ...record, database } : null
}

export default async function DetalleRegistroPage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
  const { id: databaseId, recordId } = await params
  const record = await getRecord(databaseId, recordId)
  
  if (!record) {
    notFound()
  }

  const data = record.data as Record<string, string>

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/bases-de-datos/${databaseId}`} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Link>
              <div>
                <h1 className="font-semibold text-slate-900">Detalle del Registro</h1>
                <p className="text-xs text-slate-500">MFN: {record.mfn}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/bases-de-datos/${databaseId}/registros/${recordId}/editar`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                <Edit className="h-4 w-4" />
                Editar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">
                {data.title || "Sin título"}
              </h2>
              {data.author && (
                <p className="text-slate-500 mt-1">{data.author}</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                {(data as any).databases?.name && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <BookOpen className="h-4 w-4" />
                    {(data as any).databases.name}
                  </span>
                )}
                {data.cdu && (
                  <span className="px-2 py-0.5 bg-slate-100 text-sm text-slate-600 rounded">
                    CDU: {data.cdu}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4">Información Bibliográfica</h3>
            <div className="space-y-4">
              
              {data.author && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Autor(es)</div>
                    <div className="text-sm text-slate-900">{data.author}</div>
                  </div>
                </div>
              )}

              {data.publisher && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Editorial</div>
                    <div className="text-sm text-slate-900">{data.publisher}</div>
                  </div>
                </div>
              )}

              {data.place && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Lugar de Publicación</div>
                    <div className="text-sm text-slate-900">{data.place}</div>
                  </div>
                </div>
              )}

              {data.year && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Año de Publicación</div>
                    <div className="text-sm text-slate-900">{data.year}</div>
                  </div>
                </div>
              )}

              {data.edition && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Edición</div>
                    <div className="text-sm text-slate-900">{data.edition}</div>
                  </div>
                </div>
              )}

              {data.pages && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Páginas</div>
                    <div className="text-sm text-slate-900">{data.pages}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-4">Identificadores y Clasificación</h3>
            <div className="space-y-4">
              
              {data.isbn && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">ISBN</div>
                    <div className="text-sm text-slate-900 font-mono">{data.isbn}</div>
                  </div>
                </div>
              )}

              {data.barcode && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Código de Barras</div>
                    <div className="text-sm text-slate-900 font-mono">{data.barcode}</div>
                  </div>
                </div>
              )}

              {data.cdu && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Clasificación CDU</div>
                    <div className="text-sm text-slate-900">{data.cdu}</div>
                  </div>
                </div>
              )}

              {data.subject && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Materias</div>
                    <div className="text-sm text-slate-900">{data.subject}</div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {data.description && (
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-medium text-slate-900 mb-4">Notas</h3>
              <p className="text-sm text-slate-600">{data.description}</p>
            </div>
          )}

        </div>

        <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ID: {record.id}</span>
            <span>Creado: {record.createdAt ? new Date(record.createdAt).toLocaleString("es-ES") : "—"}</span>
          </div>
        </div>

      </main>
    </div>
  )
}
