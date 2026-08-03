import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

type PaginationItem = number | "ellipsis"

function getPaginationItems(page: number, pageCount: number): PaginationItem[] {
  const visiblePages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  if (page <= 3) [1, 2, 3, 4].forEach((item) => visiblePages.add(item))
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1, pageCount].forEach((item) => visiblePages.add(item))

  const pages = [...visiblePages].filter((item) => item >= 1 && item <= pageCount).sort((a, b) => a - b)
  return pages.flatMap((item, index) => (index > 0 && item - pages[index - 1] > 1 ? ["ellipsis", item as number] : [item]))
}

type CatalogPaginationProps = {
  currentPage: number
  pageCount: number
  pageHref: (page: number) => string
  ariaLabel: string
}

export function CatalogPagination({ currentPage, pageCount, pageHref, ariaLabel }: CatalogPaginationProps) {
  if (pageCount <= 1) return null

  const paginationItems = getPaginationItems(currentPage, pageCount)

  return (
    <nav className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between" aria-label={ariaLabel}>
      <span className="text-slate-500 dark:text-slate-400">Página {currentPage} de {pageCount}</span>
      <div className="flex items-center justify-center gap-1.5">
        {currentPage > 1 ? <Link href={pageHref(currentPage - 1)} aria-label="Página anterior" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-950"><ArrowLeft className="h-4 w-4" /></Link> : <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"><ArrowLeft className="h-4 w-4" /></span>}
        {paginationItems.map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} aria-hidden="true" className="inline-flex h-9 w-6 items-center justify-center text-slate-400">…</span> : <Link key={item} href={pageHref(item)} aria-current={item === currentPage ? "page" : undefined} aria-label={`Página ${item}`} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 font-medium transition-colors ${item === currentPage ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-950"}`}>{item}</Link>)}
        {currentPage < pageCount ? <Link href={pageHref(currentPage + 1)} aria-label="Página siguiente" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-950"><ArrowRight className="h-4 w-4" /></Link> : <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"><ArrowRight className="h-4 w-4" /></span>}
      </div>
    </nav>
  )
}
