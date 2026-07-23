import type { ReactNode } from "react"
import Link from "next/link"
import { Library } from "lucide-react"

type MugaHeaderProps = {
  title?: string
  subtitle?: string
  homeHref?: string
  navigation?: ReactNode
  actions?: ReactNode
}

export function MugaHeader({
  title = "MUGA",
  subtitle = "Gestión Bibliotecaria",
  homeHref = "/",
  navigation,
  actions,
}: MugaHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-5 px-6 py-3">
        <Link href={homeHref} className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800">
            <Library className="h-4 w-4 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
            {subtitle ? <span className="block truncate text-xs text-slate-500">{subtitle}</span> : null}
          </span>
        </Link>

        <div className="flex items-center gap-5">
          {navigation ? <nav className="hidden items-center gap-5 text-sm text-slate-500 md:flex">{navigation}</nav> : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  )
}
