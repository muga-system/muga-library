import type { NextResponse } from "next/server"
import { apiError } from "@/lib/api/http"
import { getCurrentUser, isAdmin, isLibraryStaff, type AuthUser } from "@/lib/auth/service"

type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse }

export async function requireApiUser(): Promise<AuthResult> {
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, response: apiError(401, "AUTH_REQUIRED", "Authentication required") }
  }
  return { ok: true, user }
}

export async function requireApiAdmin(): Promise<AuthResult> {
  const auth = await requireApiUser()
  if (!auth.ok) return auth
  if (!isAdmin(auth.user)) {
    return { ok: false, response: apiError(403, "ADMIN_REQUIRED", "Admin access required") }
  }
  return auth
}

export async function requireApiStaff(): Promise<AuthResult> {
  const auth = await requireApiUser()
  if (!auth.ok) return auth
  if (!isLibraryStaff(auth.user)) {
    return { ok: false, response: apiError(403, "STAFF_REQUIRED", "Library staff access required") }
  }
  return auth
}
