import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, Plus, Search, FileText, Pencil, Grid2X2, List } from "lucide-react"
import { getDatabaseBySlug, getDatabaseById, getRecordsByDatabase, searchRecords, countSearchRecords } from "@/lib/services/database"
import { RecordsTable } from "./records-table"
import { CatalogCards } from "./catalog-cards"
import { CatalogPagination } from "@/components/catalog-pagination"
import { MugaHeader } from "@/components/muga-header"
import { requireStaffPage, staffOwnerId } from "@/lib/auth/page"

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
  const user = await requireStaffPage()
  const ownerId = staffOwnerId(user)
  const { page, q, view } = await searchParams
  const gallery = view !== "table"
  const pageSize = gallery ? 20 : 50
  const currentPage = Math.max(1, Number.parseInt(page || "1", 10) || 1)
  const offset = (currentPage - 1) * pageSize

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  
  let database = isUuid ? await getDatabaseById(id, ownerId) : null

  if (!database) {
    database = await getDatabaseBySlug(id, ownerId)
  }

  if (!database) {
    notFound()
  }

  const query = q?.trim() || ""
  const searchResult = query ? await searchRecords(query, database.id, { limit: pageSize, offset }, ownerId) : null
  const result = searchResult
    ? { records: searchResult, total: await countSearchRecords(query, database.id, ownerId) }
    : await getRecordsByDatabase(database.id, { limit: pageSize, offset }, ownerId)
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
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <MugaHeader
        subtitle="Catálogo de biblioteca"
        homeHref="/bases-de-datos"
        navigation={<Link href="/catalogo" className="hover:text-slate-900 dark:hover:text-slate-200">Catálogo público</Link>}
        actions={<div className="flex items-center gap-2"><Link href={`/bases-de-datos/${database.id}/editar`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" />Editar</Link><Link href={`/bases-de-datos/${database.id}/nuevo`} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"><Plus className="h-4 w-4" />Nuevo registro</Link></div>}
      />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/bases-de-datos" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"><ArrowLeft className="h-4 w-4" />Todos los catálogos</Link>
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-semibold">{database.name}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{database.description || "Gestioná los libros y registros de este catálogo."}</p>
        </div>

        <div className="mb-10">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500"><BookOpen className="h-4 w-4" />{total} registros</div>
            <Link href="/buscar" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">Búsqueda avanzada</Link>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row">
            <form action={`/bases-de-datos/${database.id}`} className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input name="q" defaultValue={query} placeholder="Buscar por título, autor o ISBN..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
              {view === "table" ? <input type="hidden" name="view" value="table" /> : null}
              <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700">Buscar</button>
            </form>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/bases-de-datos/${database.id}?${new URLSearchParams({ ...(query ? { q: query } : {}), view: "cards" })}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${gallery ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-950"}`}><Grid2X2 className="h-4 w-4" />Galería</Link>
              <Link href={`/bases-de-datos/${database.id}?${new URLSearchParams({ ...(query ? { q: query } : {}), view: "table" })}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${!gallery ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-950"}`}><List className="h-4 w-4" />Tabla</Link>
            </div>
          </div>

          {query ? <p className="mb-4 text-sm text-slate-500">{total} resultado{total === 1 ? "" : "s"} para “{query}”</p> : null}

          {normalizedRecords.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900">
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
          {total > 0 ? <CatalogPagination currentPage={currentPage} pageCount={pageCount} pageHref={pageHref} ariaLabel="Paginación del catálogo" /> : null}
        </div>
      </main>
    </div>
  )
}
