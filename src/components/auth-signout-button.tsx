"use client"

import { useAuth } from "@/components/auth-provider"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function AuthSignOutButton() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/iniciar-sesion")
  }

  if (!user) {
    return (
      <Link 
        href="/iniciar-sesion"
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Iniciar Sesión
      </Link>
    )
  }

  return (
    <button 
      onClick={handleSignOut}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </button>
  )
}
