import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Plus, Search, Database, FileText, Pencil } from "lucide-react"
import { getDatabaseBySlug, getDatabaseById, getRecordsByDatabase } from "@/lib/services/database"
import { RecordsTable } from "./records-table"

function normalizeRecordData(data: unknown): Record<string, unknown> {
  if (typeof data && typeof data === "object") {
    return data as Record<string, unknown>
  }
  return {}
}

export default async function DatabaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page } = await searchParams
  const pageSize = 50
  const currentPage = Math.max(1, parseInt(page || '1', 10))
  const offset = (currentPage - 1) * pageSize

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  
  let database = isUuid ? await getDatabaseById(id) : null

  if (!database) {
    database = await getDatabaseBySlug(id)
  }

  if (!database) {
    notFound()
  }

  const { records, total } = await getRecordsByDatabase(database.id, { limit: pageSize, offset })
  const normalizedRecords = records.map((record) => ({
    ...record,
    data: normalizeRecordData(record.data),
  }))

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/bases-de-datos" className="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">{database.name}</h1>
                  <p className="text-xs text-slate-500">{total} registros</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/bases-de-datos/${database.id}/editar`}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
              <Link
                href={`/bases-de-datos/${database.id}/nuevo`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Registro
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {database.description && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-10">
            <p className="text-sm text-slate-600">{database.description}</p>
          </div>
        )}

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Registros</h2>
            <Link href="/buscar" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <Search className="h-4 w-4" />
              Busqueda avanzada
            </Link>
          </div>

          {normalizedRecords.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No hay registros en este catalogo</p>
              <Link href={`/bases-de-datos/${database.id}/nuevo`} className="text-sm font-medium text-slate-900 hover:underline">
                Agregar primer registro →
              </Link>
            </div>
          ) : (
            <RecordsTable 
              records={normalizedRecords} 
              databaseId={database.id} 
              databaseName={database.name}
              total={total}
              currentPage={currentPage}
              pageSize={pageSize}
            />
          )}
        </div>
      </main>
    </div>
  )
}
