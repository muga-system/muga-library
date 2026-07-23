"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BookOpen, Library, Loader2, Users } from "lucide-react"
import { signInWithEmail } from "@/lib/auth/client"
import { MugaHeader } from "@/components/muga-header"

export default function IniciarSesionPage() {
  const router = useRouter()
  const [nextPath, setNextPath] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const next = new URLSearchParams(window.location.search).get("next")
    setNextPath(next || "")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error: authError } = await signInWithEmail(email, password)
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.session) {
      const role = data.user.app_metadata.role
      router.replace(nextPath || (role === "reader" ? "/mis-solicitudes" : "/admin"))
    } else {
      setError("Error al iniciar sesión")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Acceso"
        actions={<Link href="/catalogo" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Catálogo público</Link>}
      />

      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <section className="max-w-md">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Iniciar sesión</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ingresá para gestionar una biblioteca o seguir tus solicitudes como lector.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-sm text-slate-500">
            <p>¿Querés solicitar un libro? <Link href={nextPath ? `/registro?next=${encodeURIComponent(nextPath)}` : "/registro"} className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Crear cuenta de lector</Link></p>
            <p>¿Querés incorporar una biblioteca? <Link href="/solicitar-cupon" className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Solicitar incorporación</Link></p>
          </div>
        </section>

        <aside>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Un acceso, dos recorridos</h2>
            <p className="mt-2 text-sm text-slate-500">El sitio reconoce la función de cada cuenta y la lleva al espacio correspondiente.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900"><BookOpen className="h-4 w-4 text-white" /></div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Para lectores</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Solicitudes, préstamos activos, vencimientos e historial en un mismo lugar.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900"><Library className="h-4 w-4 text-white" /></div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Para bibliotecarios</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Catálogos, registros, solicitudes, entregas y devoluciones desde el panel.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900 sm:col-span-2">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900"><Users className="h-4 w-4 text-white" /></div>
                <div><h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Acceso según tu función</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">Cada persona entra al espacio de su biblioteca. Los permisos definirán qué tareas puede realizar.</p></div>
              </div>
            </div>
          </div>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Conocer cómo funciona MUGA <ArrowRight className="h-4 w-4" /></Link>
        </aside>
      </main>
    </div>
  )
}
