import { getPublicDatabases } from "@/lib/services/coupons"
import Link from "next/link"
import { Library, Search, BookOpen, Users } from "lucide-react"

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; catalog?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() || ""
  const catalogFilter = params.catalog?.trim() || ""

  const databases = await getPublicDatabases()

  let filteredDatabases = databases
  if (query) {
    const q = query.toLowerCase()
    filteredDatabases = filteredDatabases.filter(
      (db: any) =>
        db.name?.toLowerCase().includes(q) ||
        db.description?.toLowerCase().includes(q) ||
        db.profiles?.library_name?.toLowerCase().includes(q)
    )
  }

  if (catalogFilter) {
    filteredDatabases = filteredDatabases.filter((db: any) => db.id === catalogFilter)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
                    <Library className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">MUGA</h1>
                    <p className="text-xs text-slate-500">Explorar comunidad</p>
                  </div>
                </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/iniciar-sesion"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
            >
              Mi Biblioteca
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Explorar Bibliotecas
          </h2>

          <form className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Buscar por nombre de biblioteca o catálogo..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
            >
              Buscar
            </button>
          </form>
        </div>

        {filteredDatabases.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No se encontraron bibliotecas
            </h3>
            <p className="text-slate-500">
              {query ? "Intenta con otros términos de búsqueda" : "Aún no hay bibliotecas públicas"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatabases.map((db: any) => (
              <Link
                key={db.id}
                href={`/bases-de-datos/${db.id}`}
                className="block p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                    <Library className="h-6 w-6 text-white" />
                  </div>
                  {db.catalog_type && (
                    <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 capitalize">
                      {db.catalog_type}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-teal-600 transition-colors">
                  {db.name}
                </h3>

                {db.profiles?.library_name && (
                  <p className="text-sm text-slate-500 mb-2">
                    {db.profiles.library_name}
                  </p>
                )}

                {db.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                    {db.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Ver catálogo
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-500">
            ¿Tienes una biblioteca?{" "}
            <Link href="/solicitar-cupon" className="text-teal-600 hover:text-teal-700 font-medium">
              Solicita tu código de activación
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MUGA - Sistema de Gestión Bibliotecaria
        </div>
      </footer>
    </div>
  )
}
