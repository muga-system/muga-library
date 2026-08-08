"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react"
import { signUpWithEmail } from "@/lib/auth/client"
import { MugaHeader } from "@/components/muga-header"
import { PasswordInput } from "@/components/password-input"
import { useAuth } from "@/components/auth-provider"

export default function RegistroPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const [nextPath, setNextPath] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    setNextPath(new URLSearchParams(window.location.search).get("next") || "")
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setLoading(false)
      return
    }

    const { data, error: authError } = await signUpWithEmail(email, password)
    if (authError) {
      setError(authError.message === "EMAIL_ALREADY_REGISTERED" ? "Ya existe una cuenta con este correo." : authError.message)
      setLoading(false)
      return
    }

    if (!data?.session) {
      setError("No se pudo iniciar la sesión de tu nueva cuenta")
      setLoading(false)
      return
    }

    await refreshSession()
    router.replace(nextPath || "/catalogo")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Cuenta de lector"
        actions={<Link href={nextPath ? `/iniciar-sesion?next=${encodeURIComponent(nextPath)}` : "/iniciar-sesion"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Ya tengo cuenta</Link>}
      />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <div className="mb-8">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800"><BookOpen className="h-5 w-5 text-white" /></div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Creá tu cuenta de lector</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Esta cuenta sirve para solicitar libros y seguir tus préstamos. No crea una biblioteca ni habilita funciones administrativas.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Correo electrónico</label>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="tu@email.com" />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="Mínimo 8 caracteres" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Repetir contraseña</label>
                <PasswordInput id="confirmPassword" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{error}</div> : null}

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creando cuenta...</> : "Crear cuenta de lector"}
              </button>
            </form>

            <aside className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><p>Una sola cuenta para consultar las bibliotecas participantes.</p></div>
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><p>Cada biblioteca revisa y aprueba sus propias solicitudes.</p></div>
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><p>Podrás consultar el estado y las fechas de devolución.</p></div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
