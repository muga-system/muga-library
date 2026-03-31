"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeFooterToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-[104px]" aria-hidden="true" />
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/80 p-0.5 text-xs shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "system" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        aria-label="Tema automatico"
        title="Automatico"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "light" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        aria-label="Tema claro"
        title="Claro"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "dark" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        aria-label="Tema oscuro"
        title="Oscuro"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
