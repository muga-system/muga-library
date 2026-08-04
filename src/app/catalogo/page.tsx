import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, Library, Search } from "lucide-react"
import { getPublicBooks, getPublicCatalogs } from "@/lib/services/database"
import { PublicCatalogCards } from "./public-catalog-cards"
import { MugaHeader } from "@/components/muga-header"
import { CatalogPagination } from "@/components/catalog-pagination"
import { getCurrentUser, type AuthUser } from "@/lib/auth/service"
import { HomeAccountActions } from "@/components/home-account-actions"

function PublicHeader({ user }: { user: AuthUser | null }) {
  return (
    <MugaHeader
      subtitle="Catálogos públicos"
      navigation={<Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200">Conocer MUGA</Link>}
      actions={<HomeAccountActions initialUser={user} />}
    />
  )
}

export default async function PublicCatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; catalog?: string; page?: string }> }) {
  const params = await searchParams
  const user = await getCurrentUser()
  const query = params.q?.trim() || ""
  const catalogId = params.catalog?.trim() || ""
  const catalogs = await getPublicCatalogs()
  const selectedCatalog = catalogId ? catalogs.find((catalog) => catalog.id === catalogId) : null

  if (!selectedCatalog) {
    return (
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <PublicHeader user={user} />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-2xl font-semibold">Catálogos públicos</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Conocé las colecciones que las bibliotecas decidieron compartir y elegí cuál querés consultar.</p>
          </div>

          {catalogId ? (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              El catálogo solicitado no está disponible públicamente. Podés elegir otro de la lista.
            </div>
          ) : null}

          {catalogs.length > 0 ? (
            <div className="grid max-w-4xl gap-4 md:grid-cols-2">
              {catalogs.map((catalog) => (
                <Link key={catalog.id} href={`/catalogo?catalog=${catalog.id}`} className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800"><Library className="h-5 w-5 text-white" /></div>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"><BookOpen className="h-3.5 w-3.5" />{catalog.totalBooks} libros</span>
                  </div>
                  <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">{catalog.name}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{catalog.description || "Colección bibliográfica disponible para consulta pública."}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
                    <span className="capitalize text-slate-500">{catalog.catalogType === "general" ? "Catálogo general" : catalog.catalogType}</span>
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">Abrir catálogo <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl rounded-xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <h2 className="font-medium text-slate-900 dark:text-slate-100">Todavía no hay catálogos públicos</h2>
              <p className="mt-2 text-sm text-slate-500">Cuando una biblioteca publique su colección, aparecerá en este espacio.</p>
            </div>
          )}
        </main>
      </div>
    )
  }

  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1)
  const pageSize = 20
  const result = await getPublicBooks({ search: query, databaseId: selectedCatalog.id, page, pageSize })
  const pageCount = Math.max(1, Math.ceil(result.total / pageSize))
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams({ catalog: selectedCatalog.id })
    if (query) next.set("q", query)
    if (nextPage > 1) next.set("page", String(nextPage))
    return `/catalogo?${next.toString()}`
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader user={user} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/catalogo" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"><ArrowLeft className="h-4 w-4" />Todos los catálogos</Link>
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-semibold">{selectedCatalog.name}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{selectedCatalog.description || "Explorá los libros disponibles en este catálogo."}</p>
        </div>

        <form className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
          <input type="hidden" name="catalog" value={selectedCatalog.id} />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={query} placeholder="Buscar por título, autor o ISBN..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <button className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Buscar</button>
        </form>

        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500"><BookOpen className="h-4 w-4" />{result.total} libros encontrados</div>
        <PublicCatalogCards books={result.items} />

        <CatalogPagination currentPage={page} pageCount={pageCount} pageHref={pageHref} ariaLabel="Paginación pública" />
      </main>
    </div>
  )
}
