import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Plus, Search, Database, FileText, Pencil, Grid2X2, List } from "lucide-react"
import { getDatabaseBySlug, getDatabaseById, getRecordsByDatabase, searchRecords, countSearchRecords } from "@/lib/services/database"
import { RecordsTable } from "./records-table"
import { CatalogCards } from "./catalog-cards"

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
  searchParams: Promise<{ page?: string; q?: string; view?: string }>
}) {
  const { id } = await params
  const { page, q, view } = await searchParams
  const gallery = view !== "table"
  const pageSize = gallery ? 20 : 50
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

  const query = q?.trim() || ""
  const searchResult = query ? await searchRecords(query, database.id, { limit: pageSize, offset }) : null
  const result = searchResult
    ? { records: searchResult, total: await countSearchRecords(query, database.id) }
    : await getRecordsByDatabase(database.id, { limit: pageSize, offset })
  const { records, total } = result
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (nextPage > 1) params.set("page", String(nextPage))
    if (!gallery) params.set("view", "table")
    const suffix = params.toString()
    return `/bases-de-datos/${database.id}${suffix ? `?${suffix}` : ""}`
  }
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
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-medium text-slate-900">Registros</h2>
            <div className="flex flex-wrap items-center gap-2">
              <form action={`/bases-de-datos/${database.id}`} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input name="q" defaultValue={query} placeholder="Buscar título, autor o ISBN" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-teal-500 sm:w-72" />
                {view === "table" ? <input type="hidden" name="view" value="table" /> : null}
              </form>
              <Link href={`/bases-de-datos/${database.id}?${new URLSearchParams({ ...(query ? { q: query } : {}), view: "cards" })}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${gallery ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                <Grid2X2 className="h-4 w-4" /> Galería
              </Link>
              <Link href={`/bases-de-datos/${database.id}?${new URLSearchParams({ ...(query ? { q: query } : {}), view: "table" })}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${!gallery ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                <List className="h-4 w-4" /> Tabla
              </Link>
              <Link href="/buscar" className="text-sm text-slate-500 hover:text-slate-700">Búsqueda avanzada</Link>
            </div>
          </div>

          {query ? <p className="mb-4 text-sm text-slate-500">{total} resultado{total === 1 ? "" : "s"} para “{query}”</p> : null}

          {normalizedRecords.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No hay registros en este catalogo</p>
              <Link href={`/bases-de-datos/${database.id}/nuevo`} className="text-sm font-medium text-slate-900 hover:underline">
                Agregar primer registro →
              </Link>
            </div>
          ) : gallery ? (
            <CatalogCards records={normalizedRecords} databaseId={database.id} />
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
          {total > 0 && pageCount > 1 ? (
            <nav className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" aria-label="Paginación del catálogo">
              <span className="text-slate-500">Página {currentPage} de {pageCount}</span>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? <Link href={pageHref(currentPage - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">Anterior</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Anterior</span>}
                {currentPage < pageCount ? <Link href={pageHref(currentPage + 1)} className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800">Siguiente</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Siguiente</span>}
              </div>
            </nav>
          ) : null}
        </div>
      </main>
    </div>
  )
}
