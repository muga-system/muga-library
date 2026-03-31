"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

type ConfirmOptions = {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  tone?: "danger" | "default"
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: async () => false,
})

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const close = useCallback((value: boolean) => {
    setOptions(null)
    if (resolverRef.current) {
      resolverRef.current(value)
      resolverRef.current = null
    }
  }, [])

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  useEffect(() => {
    if (!options) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [options, close])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {options ? (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={() => close(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{options.title}</h3>
            {options.description ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{options.description}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {options.cancelText ?? "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={
                  options.tone === "danger"
                    ? "rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
                    : "rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                }
              >
                {options.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
