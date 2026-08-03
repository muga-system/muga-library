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
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <MugaHeader subtitle="Incorporación de bibliotecas" />

        <main className="mx-auto flex max-w-6xl justify-center px-6 py-12">
          <section className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Solicitud enviada
            </h1>
            <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Recibimos la solicitud de incorporación de <strong>{libraryName}</strong>.
              Te escribiremos cuando la revisemos y, si corresponde, enviaremos el código de activación.
            </p>
            <Link
              href="/"
              className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Volver al inicio
            </Link>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Incorporación de bibliotecas"
        actions={<Link href="/iniciar-sesion" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Iniciar sesión</Link>}
      />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-5xl">
          <div className="mb-10 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Incorporar mi biblioteca
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Contanos qué biblioteca querés sumar y te contactaremos.
              </p>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div>
              <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="libraryName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nombre de la biblioteca
            </label>
            <input
              id="libraryName"
              type="text"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              placeholder="Biblioteca Escuela Juan XXIII"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Correo de contacto
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Sobre la biblioteca <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tipo de institución, comunidad a la que pertenece, cantidad aproximada de libros..."
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !libraryName}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Enviar solicitud
              </>
            )}
          </button>
              </form>

              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                ¿Ya recibiste un código de activación?{" "}
                <Link href="/activar" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
                  Activar mi biblioteca
                </Link>
              </p>
            </div>

            <aside className="space-y-6 text-sm text-slate-600 dark:border-l dark:border-slate-800 dark:pl-8 dark:text-slate-300 lg:border-l lg:border-slate-200 lg:pl-8">
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p>Revisamos cada solicitud antes de incorporar una biblioteca.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p>Si la solicitud corresponde, te enviamos un código de activación.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p>Con ese código vas a poder habilitar el catálogo de tu biblioteca.</p>
              </div>
            </aside>
          </div>

        </div>
      </main>
    </div>
  )
}
