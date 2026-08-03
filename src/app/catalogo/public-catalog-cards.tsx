import { BookOpen } from "lucide-react"
import { BookCatalogCard } from "@/components/book-catalog-card"
import type { PublicBook } from "@/lib/services/database"

export function PublicCatalogCards({ books }: { books: PublicBook[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCatalogCard
          key={book.id}
          href={`/libro/${book.id}`}
          title={book.title}
          author={book.author}
          year={book.year}
          coverUrl={book.coverUrl}
          available={book.disponibles}
        />
      ))}
      {books.length === 0 ? <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900"><BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />No se encontraron libros.</div> : null}
    </div>
  )
}
