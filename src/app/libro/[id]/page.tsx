import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyLoanStatusForRecord, getPublicBookById } from "@/lib/services/database"
import { PublicLoanCta } from "@/components/public-loan-cta"
import { BookCoverImage } from "@/components/book-cover-image"

function coverResolver(title: string, author: string, isbn: string) {
  const params = new URLSearchParams()
  if (title) params.set("title", title)
  if (author) params.set("author", author)
  if (isbn) params.set("isbn", isbn)
  return `/api/public/book-cover?${params.toString()}`
}

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
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  const loanStatus = userId ? await getMyLoanStatusForRecord(id, userId) : null

  if (!book) notFound()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
          <Link href="/admin" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Ir al panel admin
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[320px,1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-800">
            {book.coverUrl ? (
              <BookCoverImage
                src={book.coverUrl}
                fallbackSrc={coverResolver(book.title, book.author, book.isbn)}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <BookOpen className="h-10 w-10" />
              </div>
            )}
          </div>
        </div>

        <section>
          {query.solicitud === "ok" ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
              Solicitud registrada correctamente.
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
      </main>
    </div>
  )
}
