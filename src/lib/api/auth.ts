import type { User } from "@supabase/supabase-js"
import type { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiError } from "@/lib/api/http"

type AuthResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }

export async function requireApiUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return {
      ok: false,
      response: apiError(401, "AUTH_REQUIRED", "Authentication required"),
    }
  }

  return { ok: true, user: data.user }
}

function isAdminUser(user: User): boolean {
  const appRole = String(user.app_metadata?.role || "").toLowerCase()
  const userRole = String(user.user_metadata?.role || "").toLowerCase()
  return appRole === "admin" || userRole === "admin"
}

export async function requireApiAdmin(): Promise<AuthResult> {
  const auth = await requireApiUser()
  if (!auth.ok) return auth

  if (!isAdminUser(auth.user)) {
    return {
      ok: false,
      response: apiError(403, "ADMIN_REQUIRED", "Admin access required"),
    }
  }

  return auth
}
