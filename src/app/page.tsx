import Link from "next/link"
import { BookOpen, Library, Search, Filter, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getActiveLoanRecordIdsForUser, getPublicBooks, getPublicCatalogs } from "@/lib/services/database"
import { BookCoverImage } from "@/components/book-cover-image"
import { AuthSignOutButton } from "@/components/auth-signout-button"

function coverResolver(title: string, author: string, isbn: string) {
  const params = new URLSearchParams()
  if (title) params.set("title", title)
  if (author) params.set("author", author)
  if (isbn) params.set("isbn", isbn)
  return `/api/public/book-cover?${params.toString()}`
}

export default async function PublicLibraryHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; catalog?: string; page?: string; solicitud?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() || ""
  const catalog = params.catalog?.trim() || ""
  const page = Math.max(1, Number(params.page || "1") || 1)
  const loanSuccess = params.solicitud === "ok"

  const [booksResult, catalogs] = await Promise.all([
    getPublicBooks({ search: query, databaseId: catalog || undefined, page, pageSize: 20 }),
    getPublicCatalogs(),
  ])

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const activeLoanRecordIds = authData.user
    ? await getActiveLoanRecordIdsForUser(authData.user.id)
    : new Set<string>()

  const books = booksResult.items
  const totalPages = Math.max(1, Math.ceil(booksResult.total / booksResult.pageSize))

  function buildQuery(nextPage: number) {
    const qs = new URLSearchParams()
    if (query) qs.set("q", query)
    if (catalog) qs.set("catalog", catalog)
    if (nextPage > 1) qs.set("page", String(nextPage))
    const str = qs.toString()
    return str ? `/?${str}` : "/"
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Biblioteca</h1>
              <p className="text-xs text-slate-500">Explora libros y consulta disponibilidad</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authData.user ? (
              <>
                <Link href="/mis-solicitudes" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Mis solicitudes</Link>
                <Link href="/admin" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Panel admin</Link>
                <AuthSignOutButton />
              </>
            ) : (
              <Link href="/iniciar-sesion" className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">Iniciar sesión</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {loanSuccess ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
            Solicitud de préstamo enviada correctamente.
          </div>
        ) : null}

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5" />
            Biblioteca pública
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Catálogo de libros</h2>
          <p className="text-slate-500">Visualiza portadas, consulta detalles y solicita préstamos con tu cuenta.</p>
        </section>

        <form method="GET" className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-[1fr,280px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por título, autor, ISBN o catálogo..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              name="catalog"
              defaultValue={catalog}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Todos los catálogos</option>
              {catalogs.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </form>

        {books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-slate-500">No encontramos libros con ese criterio.</p>
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => (
              <Link key={book.id} href={`/libro/${book.id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-800">
                  {book.coverUrl ? (
                    <BookCoverImage
                      src={book.coverUrl}
                      fallbackSrc={coverResolver(book.title, book.author, book.isbn)}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">{book.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{book.author || "Autor no disponible"}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{book.databaseName}</span>
                    <span className={book.disponibles > 0 ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}>
                      {book.disponibles > 0 ? `${book.disponibles} disp.` : "Sin stock"}
                    </span>
                  </div>
                  {activeLoanRecordIds.has(book.id) ? (
                    <div className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                      Ya solicitado
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Requiere login para préstamo
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </section>
        )}

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-between text-sm">
            <span className="text-slate-500">Página {booksResult.page} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <Link
                href={buildQuery(Math.max(1, booksResult.page - 1))}
                className={`rounded-lg border px-3 py-1.5 ${booksResult.page <= 1 ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"}`}
              >
                Anterior
              </Link>
              <Link
                href={buildQuery(Math.min(totalPages, booksResult.page + 1))}
                className={`rounded-lg border px-3 py-1.5 ${booksResult.page >= totalPages ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"}`}
              >
                Siguiente
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
