import Link from "next/link"
import {
  Library,
  BookOpen,
  Search,
  Plus,
  Upload,
  Tags,
  Users,
  Settings,
  ArrowRight,
  Building2,
  Clock,
} from "lucide-react"
import { AuthSignOutButton } from "@/components/auth-signout-button"
import { createClient } from "@/lib/supabase/server"
import { getLoanStats } from "@/lib/services/database"

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function getStats() {
  const supabase = await createClient()
  const [databasesResult, recordsResult, loanStats] = await Promise.all([
    supabase.from("databases").select("id", { count: "exact", head: true }),
    supabase.from("records").select("id", { count: "exact", head: true }),
    getLoanStats().catch(() => ({ requested: 0, active: 0, overdue: 0, returned: 0 })),
  ])

  return {
    databases: databasesResult.count || 0,
    records: recordsResult.count || 0,
    requested: loanStats.requested || 0,
    loans: loanStats.active || 0,
    overdue: loanStats.overdue || 0,
  }
}

async function getDatabases() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("databases")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false })
  return data || []
}

export default async function AdminPage() {
  const stats = await getStats()
  const databases = await getDatabases()

  return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <header className="border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                <Library className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Panel Administrativo</span>
            </div>
            <AuthSignOutButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-12">
            <h1 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="text-slate-500">Gestiona bibliotecas, registros y préstamos</p>
          </div>

          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.databases}</div>
              <div className="text-sm text-slate-500">Catálogos</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.records}</div>
              <div className="text-sm text-slate-500">Registros</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.loans}</div>
              <div className="text-sm text-slate-500">Préstamos activos</div>
              <div className="mt-1 text-xs text-slate-500">Vencidos: <span className="font-medium text-slate-700 dark:text-slate-300">{stats.overdue}</span></div>
            </div>
            <Link href="/admin/solicitudes" className="rounded-lg border border-amber-200 bg-amber-50 p-4 transition-all hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="text-2xl font-semibold text-amber-800 dark:text-amber-200">{stats.requested}</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">Solicitudes pendientes</div>
              <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">Revisar ahora →</div>
            </Link>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/bases-de-datos/nuevo" className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Plus className="h-5 w-5 text-white" /></div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mb-1 font-medium text-slate-900 dark:text-slate-100">Nuevo Catálogo</h3>
              <p className="text-sm text-slate-500">Crear base de datos bibliográfica</p>
            </Link>

            <Link href="/buscar" className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Search className="h-5 w-5 text-white" /></div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mb-1 font-medium text-slate-900 dark:text-slate-100">Búsqueda</h3>
              <p className="text-sm text-slate-500">Buscar en todos los catálogos</p>
            </Link>

            <Link href="/importar" className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Upload className="h-5 w-5 text-white" /></div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mb-1 font-medium text-slate-900 dark:text-slate-100">Importar</h3>
              <p className="text-sm text-slate-500">Cargar datos CSV y Excel</p>
            </Link>
          </div>

          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Catálogos</h2>
              <Link href="/bases-de-datos" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Ver todos →</Link>
            </div>

            <div className="space-y-2">
              {databases.slice(0, 5).map((db) => {
                const slug = toSlug(db.name)
                return (
                  <Link key={db.id} href={`/bases-de-datos/${slug}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-200 dark:bg-slate-800"><Building2 className="h-4 w-4 text-slate-600 dark:text-slate-300" /></div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{db.name}</div>
                        {db.description ? <div className="text-sm text-slate-500">{db.description}</div> : null}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Link href="/prestamos" className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"><Clock className="mx-auto mb-2 h-5 w-5 text-slate-600 dark:text-slate-300" /><div className="text-sm font-medium text-slate-900 dark:text-slate-100">Préstamos</div><div className="text-xs text-slate-500">Gestionar</div></Link>
            <Link href="/cdu" className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"><Tags className="mx-auto mb-2 h-5 w-5 text-slate-600 dark:text-slate-300" /><div className="text-sm font-medium text-slate-900 dark:text-slate-100">CDU</div><div className="text-xs text-slate-500">Clasificación</div></Link>
            <Link href="/buscar" className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"><BookOpen className="mx-auto mb-2 h-5 w-5 text-slate-600 dark:text-slate-300" /><div className="text-sm font-medium text-slate-900 dark:text-slate-100">Registros</div><div className="text-xs text-slate-500">Ver todos</div></Link>
            <Link href="/bases-de-datos" className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"><Library className="mx-auto mb-2 h-5 w-5 text-slate-600 dark:text-slate-300" /><div className="text-sm font-medium text-slate-900 dark:text-slate-100">Catálogos</div><div className="text-xs text-slate-500">Administrar</div></Link>
            <Link href="/configuracion" className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"><Settings className="mx-auto mb-2 h-5 w-5 text-slate-600 dark:text-slate-300" /><div className="text-sm font-medium text-slate-900 dark:text-slate-100">Ajustes</div><div className="text-xs text-slate-500">Configuración</div></Link>
          </div>
        </main>
      </div>
  )
}
