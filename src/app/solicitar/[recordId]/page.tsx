import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/service"
import { getMyLoanStatusForRecord, getPublicBookById } from "@/lib/services/database"
import { PublicLoanForm } from "@/components/public-loan-form"
import { MugaHeader } from "@/components/muga-header"

export default async function RequestLoanPage({
  params,
}: {
  params: Promise<{ recordId: string }>
}) {
  const { recordId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/iniciar-sesion?next=${encodeURIComponent(`/solicitar/${recordId}`)}`)
  }

  const currentStatus = await getMyLoanStatusForRecord(recordId, user.id)
  if (currentStatus?.status === "requested" || currentStatus?.status === "active" || currentStatus?.status === "overdue") {
    redirect(`/libro/${recordId}?solicitud=duplicada`)
  }

  const book = await getPublicBookById(recordId)
  if (!book) notFound()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Solicitud de préstamo"
        homeHref={`/catalogo?catalog=${book.databaseId}`}
        actions={<Link href="/mis-solicitudes" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Mis préstamos</Link>}
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href={`/libro/${recordId}`} className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"><ArrowLeft className="h-4 w-4" />Volver al libro</Link>

        <div className="mb-7 max-w-2xl">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Solicitar préstamo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">La solicitud se enviará a la biblioteca responsable. El préstamo comienza cuando el equipo bibliotecario la aprueba.</p>
        </div>

        <div className="max-w-3xl space-y-5">
          <section className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800"><BookOpen className="h-5 w-5 text-white" /></div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">{book.databaseName}</p>
              <h2 className="mt-1 font-medium text-slate-900 dark:text-slate-100">{book.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{book.author || "Autor no disponible"} · {book.disponibles} {book.disponibles === 1 ? "ejemplar disponible" : "ejemplares disponibles"}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <PublicLoanForm recordId={book.id} databaseId={book.databaseId} accountEmail={user.email} />
          </section>

          <div className="flex items-start gap-3 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500 dark:border-slate-800">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
            <p>Después de enviarla podrás consultar la respuesta, el vencimiento y la devolución desde <Link href="/mis-solicitudes" className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Mis préstamos</Link>.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
