"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Library, Loader2 } from "lucide-react"
import { signInWithEmail } from "@/lib/supabase/auth"

export default function IniciarSesionPage() {
  const router = useRouter()
  const [nextPath, setNextPath] = useState("")
  const [email, setEmail] = useState("demo@biblioteca.org")
  const [password, setPassword] = useState("demo123")
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
      router.replace(nextPath || "/admin")
    } else {
      setError("Error al iniciar sesión")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
              <Library className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">MUGA Books</h1>
            <p className="text-slate-500 mt-1">Ingresa a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="correo@biblioteca.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Sin acceso? Contacta al administrador de la biblioteca
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-900 p-12">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Sistema profesional de gestión bibliotecaria
          </h2>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span>Catálogos MARC21 y UNIMARC</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span>Clasificación Decimal Universal (CDU)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span>Importación de catálogos externos</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span>Control de préstamos</span>
            </li>
          </ul>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-sm text-slate-500">
              Acceso restringido a personal autorizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
