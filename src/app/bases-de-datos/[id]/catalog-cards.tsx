import Link from "next/link"
import { BookOpen, CalendarDays, UserRound } from "lucide-react"
import { BookCoverImage } from "@/components/book-cover-image"

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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {records.map((record) => {
        const title = text(record.data, "title") || "Sin título"
        const author = text(record.data, "author") || "Autor no disponible"
        const year = text(record.data, "year")
        const cover = text(record.data, "cover_url")
        const available = record.disponibles > 0

        return (
          <Link
            key={record.id}
            href={`/bases-de-datos/${databaseId}/registros/${record.id}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-teal-500 hover:shadow-lg"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
              <BookCoverImage src={cover} alt={`Portada de ${title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm ${available ? "bg-emerald-500 text-white" : "bg-slate-800/85 text-white"}`}>
                {available ? `${record.disponibles} disponible${record.disponibles === 1 ? "" : "s"}` : "Sin ejemplares"}
              </span>
            </div>
            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 group-hover:text-teal-700">{title}</h3>
              <p className="flex items-start gap-1.5 text-xs text-slate-500"><UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-2">{author}</span></p>
              {year ? <p className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> {year}</p> : null}
            </div>
          </Link>
        )
      })}
      {records.length === 0 ? (
        <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          No se encontraron libros con esos criterios.
        </div>
      ) : null}
    </div>
  )
}
