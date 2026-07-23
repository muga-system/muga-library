import Link from "next/link"
import { BookOpen, CalendarDays, CircleCheck, CircleX, UserRound } from "lucide-react"
import { BookCoverImage } from "@/components/book-cover-image"
import type { PublicBook } from "@/lib/services/database"

export function PublicCatalogCards({ books }: { books: PublicBook[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <Link key={book.id} href={`/libro/${book.id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-slate-900">
            <BookCoverImage src={book.coverUrl} alt={`Portada de ${book.title}`} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2 p-3">
            <h2 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 dark:text-slate-100">{book.title}</h2>
            <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"><UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-2">{book.author || "Autor no disponible"}</span></p>
            {book.year ? <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><CalendarDays className="h-3.5 w-3.5" /> {book.year}</p> : null}
            <p className={`flex items-center gap-1.5 text-xs font-medium ${book.disponibles > 0 ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}`}>
              {book.disponibles > 0 ? <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <CircleX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {book.disponibles > 0 ? "Disponible" : "No disponible"}
            </p>
          </div>
        </Link>
      ))}
      {books.length === 0 ? <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900"><BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />No se encontraron libros.</div> : null}
    </div>
  )
}
