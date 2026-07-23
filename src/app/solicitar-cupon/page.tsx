"use client"

import { useState } from "react"
import Link from "next/link"
import { Library, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { MugaHeader } from "@/components/muga-header"

export default function RequestCouponPage() {
  const [email, setEmail] = useState("")
  const [libraryName, setLibraryName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/coupon-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          libraryName,
          description,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al enviar solicitud")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Solicitud enviada
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Recibimos la solicitud de incorporación de <strong>{libraryName}</strong>.
            Te escribiremos cuando la revisemos y, si corresponde, enviaremos el código de activación.
          </p>
          <Link
            href="/"
            className="block w-full py-3 text-center bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Incorporación de bibliotecas"
        actions={<Link href="/iniciar-sesion" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Iniciar sesión</Link>}
      />

      <main className="mx-auto max-w-md px-6 py-12">
        <div className="mb-7 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <Library className="h-5 w-5 text-white" />
          </div>
          <div><h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Incorporar mi biblioteca</h1><p className="mt-1 text-sm leading-6 text-slate-500">Contanos qué biblioteca querés sumar y te contactaremos.</p></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre de la biblioteca *
            </label>
            <input
              type="text"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              placeholder="Biblioteca Escuela Juan XXIII"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Correo de contacto *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sobre la biblioteca (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tipo de institución, comunidad a la que pertenece, cantidad aproximada de libros..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !libraryName}
            className="w-full py-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Enviar solicitud
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          ¿Ya recibiste un código de activación?{" "}
          <Link href="/activar" className="text-teal-600 hover:text-teal-700 font-medium">
            Activar mi biblioteca
          </Link>
        </p>
      </main>
    </div>
  )
}
