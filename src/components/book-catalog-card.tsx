import Link from "next/link"
import { CalendarDays, CircleCheck, CircleX, UserRound } from "lucide-react"
import { BookCoverImage } from "@/components/book-cover-image"

type BookCatalogCardProps = {
  href: string
  title: string
  author?: string
  year?: string
  coverUrl?: string
  available: number
  availabilityLabel?: string
}

export function BookCatalogCard({
  href,
  title,
  author = "",
  year = "",
  coverUrl = "",
  available,
  availabilityLabel,
}: BookCatalogCardProps) {
  const isAvailable = available > 0

  return (
    <Link href={href} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-slate-900">
        <BookCoverImage src={coverUrl} alt={`Portada de ${title}`} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-2 p-3">
        <h2 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"><UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-2">{author || "Autor no disponible"}</span></p>
        {year ? <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><CalendarDays className="h-3.5 w-3.5" /> {year}</p> : null}
        <p className={`flex items-center gap-1.5 text-xs font-medium ${isAvailable ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}`}>
          {isAvailable ? <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <CircleX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          {availabilityLabel || (isAvailable ? "Disponible" : "No disponible")}
        </p>
      </div>
    </Link>
  )
}
