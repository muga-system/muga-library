"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Library, Loader2 } from "lucide-react"
import { signUpWithEmail } from "@/lib/supabase/auth"

export default function RegistroPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    const { data, error: authError } = await signUpWithEmail(email, password)
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      setSuccess("¡Cuenta creada! Por favor verifica tu correo electrónico.")
      setTimeout(() => router.push("/iniciar-sesion"), 2000)
    } else {
      setError("Error al crear la cuenta")
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
            <p className="text-slate-500 mt-1">Crear cuenta</p>
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
                placeholder="tu@email.com"
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
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="Repite tu contraseña"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600">
                {success}
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
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/iniciar-sesion" className="text-slate-900 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-900 p-12">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Únete a MUGA Books
          </h2>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span>Gestión profesional de bibliotecas</span>
            </li>
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
          </ul>
        </div>
      </div>
    </div>
  )
}
