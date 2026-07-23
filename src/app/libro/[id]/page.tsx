import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/service"
import { getMyLoanStatusForRecord, getPublicBookById } from "@/lib/services/database"
import { PublicLoanCta } from "@/components/public-loan-cta"
import { BookCoverImage } from "@/components/book-cover-image"
import { MugaHeader } from "@/components/muga-header"

export default async function PublicBookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ solicitud?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const book = await getPublicBookById(id)
  const user = await getCurrentUser()
  const userId = user?.id
  const isReader = user?.app_metadata.role === "reader"
  const loanStatus = userId ? await getMyLoanStatusForRecord(id, userId) : null

  if (!book) notFound()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        subtitle="Catálogo público"
        homeHref={`/catalogo?catalog=${book.databaseId}`}
        actions={<Link href={user ? (isReader ? "/mis-solicitudes" : "/admin") : `/iniciar-sesion?next=${encodeURIComponent(`/libro/${id}`)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{user ? (isReader ? "Mis préstamos" : "Ir al panel") : "Iniciar sesión"}</Link>}
      />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href={`/catalogo?catalog=${book.databaseId}`} className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
        <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start">
        {book.coverUrl ? (
          <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 lg:w-60 lg:shrink-0">
            <div className="aspect-[3/4] max-h-[360px] bg-slate-200 dark:bg-slate-800">
              <BookCoverImage src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 lg:w-60 lg:shrink-0">
            <BookOpen className="h-5 w-5 shrink-0" />
            <span>Portada no disponible</span>
          </div>
        )}

        <section className="min-w-0 flex-1">
          {query.solicitud === "ok" ? (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
              <p className="font-medium">Solicitud enviada a la biblioteca.</p>
              <p className="mt-1">Podés seguir su estado desde <Link href="/mis-solicitudes" className="font-medium underline underline-offset-4">Mis préstamos</Link>.</p>
            </div>
          ) : query.solicitud === "duplicada" ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
              Ya tienes una solicitud o préstamo activo para este libro.
            </div>
          ) : null}

          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{book.databaseName}</p>
          <h1 className="mb-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{book.title}</h1>
          <p className="mb-6 text-slate-600 dark:text-slate-300">{book.author || "Autor no disponible"}</p>

          <div className="mb-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Disponibles</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{book.disponibles}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Ejemplares</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{book.totalEjemplares}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Año</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{book.year || "—"}</p>
            </div>
          </div>

          <div className="mb-6">
            <PublicLoanCta
              recordId={book.id}
              available={book.disponibles}
              isAuthenticated={Boolean(userId)}
              userLoanStatus={(loanStatus?.status as any) || null}
              rejectionReason={(loanStatus?.rejection_reason as string | null | undefined) || null}
            />
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1 text-xs text-slate-500">ISBN</p>
              <p className="text-slate-900 dark:text-slate-100">{book.isbn || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1 text-xs text-slate-500">Materia</p>
              <p className="text-slate-900 dark:text-slate-100">{book.subject || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1 text-xs text-slate-500">Descripción</p>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">{book.description || "Sin descripción"}</p>
            </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  )
}
