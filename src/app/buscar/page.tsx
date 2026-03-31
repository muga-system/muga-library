"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Filter, FileText, BookOpen } from "lucide-react"

interface SearchResult {
  id: string
  mfn: number
  databaseId: string
  data: Record<string, unknown>
  createdAt: string
  database_name?: string
}

export default function BuscarPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [databases, setDatabases] = useState<{ id: string; name: string }[]>([])
  
  const [selectedDatabase, setSelectedDatabase] = useState<string>("all")
  const [selectedCDU, setSelectedCDU] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadDatabases()
  }, [])

  async function loadDatabases() {
    try {
      const res = await fetch('/api/databases')
      const data = await res.json()
      setDatabases(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading databases:', error)
      setDatabases([])
    }
  }

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query)
      if (selectedDatabase !== "all") params.set('databaseId', selectedDatabase)
      params.set('limit', '100')

      const res = await fetch(`/api/records?${params.toString()}`)
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || "SEARCH_REQUEST_FAILED")
      }
      const records = Array.isArray(payload) ? payload : []

      const dbMap = new Map(databases.map(d => [d.id, d.name]))
      let resultsWithDbName = records.map((raw: any) => {
        const normalized: SearchResult = {
          id: raw.id,
          mfn: raw.mfn,
          databaseId: raw.databaseId ?? raw.database_id,
          data: raw.data ?? {},
          createdAt: raw.createdAt ?? raw.created_at,
          database_name: dbMap.get(raw.databaseId ?? raw.database_id),
        }

        return normalized
      })

      if (selectedCDU.trim()) {
        resultsWithDbName = resultsWithDbName.filter((r: SearchResult) => {
          const cdu = r.data?.cdu as string
          return cdu && cdu.startsWith(selectedCDU)
        })
      }

      setResults(resultsWithDbName)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setSelectedDatabase("all")
    setSelectedCDU("")
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">Búsqueda</h1>
              <p className="text-xs text-slate-500">Buscar en todos los catálogos</p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, autor, ISBN, materia..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFilters 
                  ? "border-slate-900 bg-slate-900 text-white" 
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Catálogo</label>
                  <select
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                  >
                    <option value="all">Todos los catálogos</option>
                    {databases.map((db) => (
                      <option key={db.id} value={db.id}>{db.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Clasificación CDU</label>
                  <input
                    type="text"
                    value={selectedCDU}
                    onChange={(e) => setSelectedCDU(e.target.value)}
                    placeholder="Ej: 5, 51, 511"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {!searched ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Realiza una búsqueda
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Ingresa términos de búsqueda para encontrar registros en los catálogos bibliográficos.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              No hay registros que coincidan con "{query}". Prueba con otros términos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                {results.length} resultado{results.length !== 1 ? "s" : ""} para "{query}"
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/bases-de-datos/${result.databaseId}/registros/${result.id}`}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-slate-900 truncate">
                          {(result.data.title as string) || "Sin título"}
                        </h4>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {(result.data.author as string) || "Sin autor"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result.data.cdu ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-xs text-slate-600 rounded">
                            {String(result.data.cdu)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {result.database_name && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {result.database_name}
                        </span>
                      )}
                      {result.data.isbn ? (
                        <span>ISBN: {String(result.data.isbn)}</span>
                      ) : null}
                      {result.data.year ? (
                        <span>{String(result.data.year)}</span>
                      ) : null}
                      <span className="text-slate-400">MFN: {result.mfn}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
