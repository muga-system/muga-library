import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyLoanStatusForRecord, getPublicBookById } from "@/lib/services/database"
import { PublicLoanForm } from "@/components/public-loan-form"

export default async function RequestLoanPage({
  params,
}: {
  params: Promise<{ recordId: string }>
}) {
  const { recordId } = await params
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect(`/iniciar-sesion?next=${encodeURIComponent(`/solicitar/${recordId}`)}`)
  }

  const currentStatus = await getMyLoanStatusForRecord(recordId, data.user.id)
  if (currentStatus?.status === "requested" || currentStatus?.status === "active" || currentStatus?.status === "overdue") {
    redirect(`/libro/${recordId}?solicitud=duplicada`)
  }

  const book = await getPublicBookById(recordId)
  if (!book) notFound()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href={`/libro/${recordId}`} className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Volver al libro
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Solicitar préstamo</h1>
          <p className="text-slate-500">Completa tus datos para solicitar <span className="font-medium text-slate-700 dark:text-slate-300">{book.title}</span>.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <PublicLoanForm
            recordId={book.id}
            databaseId={book.databaseId}
            initialName={String(data.user.user_metadata?.full_name || data.user.email || "")}
          />
        </div>
      </main>
    </div>
  )
}
