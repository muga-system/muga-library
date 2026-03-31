"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Info, X, TriangleAlert } from "lucide-react"

type NotificationType = "success" | "error" | "info" | "warning"

type NotificationInput = {
  title: string
  message?: string
  type?: NotificationType
  durationMs?: number
}

type NotificationItem = Required<NotificationInput> & {
  id: string
}

type NotificationsContextValue = {
  notify: (input: NotificationInput) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notify: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
})

function palette(type: NotificationType) {
  if (type === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
  if (type === "error") return "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
  if (type === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
  return "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200"
}

function Icon({ type }: { type: NotificationType }) {
  if (type === "success") return <CheckCircle2 className="h-4 w-4" />
  if (type === "error") return <AlertCircle className="h-4 w-4" />
  if (type === "warning") return <TriangleAlert className="h-4 w-4" />
  return <Info className="h-4 w-4" />
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const notify = useCallback((input: NotificationInput) => {
    const item: NotificationItem = {
      id: crypto.randomUUID(),
      title: input.title,
      message: input.message ?? "",
      type: input.type ?? "info",
      durationMs: input.durationMs ?? 2800,
    }

    setItems((prev) => [...prev, item])
    window.setTimeout(() => dismiss(item.id), item.durationMs)
  }, [dismiss])

  const value = useMemo<NotificationsContextValue>(() => ({
    notify,
    success: (title, message) => notify({ type: "success", title, message }),
    error: (title, message) => notify({ type: "error", title, message }),
    warning: (title, message) => notify({ type: "warning", title, message }),
    info: (title, message) => notify({ type: "info", title, message }),
  }), [notify])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[3000] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-lg border px-3 py-2 shadow-lg backdrop-blur ${palette(item.type)} bg-white/95 dark:bg-slate-900/95`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5"><Icon type={item.type} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.message ? <p className="mt-0.5 text-xs opacity-90">{item.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded p-0.5 opacity-70 transition hover:opacity-100"
                aria-label="Cerrar notificacion"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
