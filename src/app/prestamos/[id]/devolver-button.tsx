"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, CheckCircle } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { useConfirm } from "@/components/confirm-provider"

interface Props {
  prestamoId: string
}

export function DevolverButton({ prestamoId }: Props) {
  const router = useRouter()
  const notifications = useNotifications()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(false)

  const handleDevolver = async () => {
    const ok = await confirm({
      title: "Confirmar devolucion",
      description: "Se registrara la devolucion del libro y se actualizara el inventario.",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
    })
    if (!ok) return

    setLoading(true)

    try {
      const res = await fetch(`/api/loans/${prestamoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return' })
      })

      if (!res.ok) throw new Error('Failed to return')

      router.refresh()
    } catch (error) {
      notifications.error("No se pudo registrar la devolucion", "Intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDevolver}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <RotateCcw className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      {loading ? "Procesando..." : "Registrar Devolución"}
    </button>
  )
}
