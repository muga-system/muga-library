import { BookOpen } from "lucide-react"
import { BookCatalogCard } from "@/components/book-catalog-card"

type CatalogRecord = {
  id: string
  data: Record<string, unknown>
  disponibles: number
  total_ejemplares: number
}

function text(data: Record<string, unknown>, key: string) {
  return String(data[key] ?? "").trim()
}

export function CatalogCards({ records, databaseId }: { records: CatalogRecord[]; databaseId: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {records.map((record) => {
        const title = text(record.data, "title") || "Sin título"
        const author = text(record.data, "author") || "Autor no disponible"
        const year = text(record.data, "year")
        const cover = text(record.data, "cover_url")
        const available = record.disponibles > 0

        return (
          <BookCatalogCard
            key={record.id}
            href={`/bases-de-datos/${databaseId}/registros/${record.id}`}
            title={title}
            author={author}
            year={year}
            coverUrl={cover}
            available={record.disponibles}
            availabilityLabel={available ? `${record.disponibles} disponible${record.disponibles === 1 ? "" : "s"}` : "No disponible"}
          />
        )
      })}
      {records.length === 0 ? (
        <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          No se encontraron libros con esos criterios.
        </div>
      ) : null}
    </div>
  )
}
