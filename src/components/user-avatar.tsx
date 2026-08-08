"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { User } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type AvatarUser = {
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

type UserAvatarProps = {
  initialUser?: AvatarUser | null
  href?: string
}

function getInitial(user: AvatarUser) {
  const name = user.user_metadata?.full_name?.trim() || user.email.trim()
  return name.charAt(0).toUpperCase() || "U"
}

export function UserAvatar({ initialUser, href = "/configuracion" }: UserAvatarProps) {
  const { user, loading } = useAuth()
  const displayUser = user ?? (loading ? initialUser ?? null : null)
  const avatarUrl = displayUser?.user_metadata?.avatar_url || ""
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [avatarUrl])

  if (!displayUser) return null

  return (
    <Link
      href={href}
      aria-label="Abrir perfil"
      title="Abrir perfil"
      className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-900 text-sm font-semibold text-white transition-colors hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800"
    >
      {avatarUrl && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : displayUser.user_metadata?.full_name || displayUser.email ? (
        getInitial(displayUser)
      ) : (
        <User className="h-4 w-4" aria-hidden="true" />
      )}
    </Link>
  )
}
