import { compare, hash } from "bcryptjs"
import { and, eq, gt } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { profiles, sessions } from "@/lib/db/schema"

export const SESSION_COOKIE = "muga_session"
export const REQUESTS_ADMIN_ROLE = "requests_admin"
export const LIBRARIAN_ROLE = "librarian"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export type AuthUser = {
  id: string
  email: string
  app_metadata: { role: string }
  user_metadata: {
    role: string
    full_name?: string
    avatar_url?: string
  }
}

function toAuthUser(profile: typeof profiles.$inferSelect): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    app_metadata: { role: profile.role },
    user_metadata: {
      role: profile.role,
      full_name: profile.fullName || "",
      avatar_url: profile.avatarUrl || "",
    },
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function createUser(email: string, password: string, role = "reader") {
  const normalizedEmail = normalizeEmail(email)
  const existing = db.select().from(profiles).where(eq(profiles.email, normalizedEmail)).get()
  if (existing) throw new Error("EMAIL_ALREADY_REGISTERED")
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT")

  const passwordHash = await hash(password, 12)
  const [profile] = db.insert(profiles).values({
    email: normalizedEmail,
    passwordHash,
    role,
  }).returning().all()
  return toAuthUser(profile)
}

export async function authenticateUser(email: string, password: string) {
  const profile = db.select().from(profiles).where(eq(profiles.email, normalizeEmail(email))).get()
  if (!profile || !profile.isActive || !(await compare(password, profile.passwordHash))) {
    return null
  }
  return toAuthUser(profile)
}

export function createSession(userId: string) {
  const sessionId = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  db.insert(sessions).values({ id: sessionId, userId, expiresAt }).run()
  return { sessionId, expiresAt }
}

export async function setSessionCookie(sessionId: string, expiresAt: number) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt * 1000),
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) db.delete(sessions).where(eq(sessions.id, sessionId)).run()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const result = db.select({ profile: profiles, session: sessions })
    .from(sessions)
    .innerJoin(profiles, eq(sessions.userId, profiles.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, Math.floor(Date.now() / 1000))))
    .get()

  if (!result || !result.profile.isActive) {
    cookieStore.delete(SESSION_COOKIE)
    return null
  }

  return toAuthUser(result.profile)
}

export function isAdmin(user: AuthUser | null) {
  return user?.app_metadata.role === "admin" || user?.user_metadata.role === "admin"
}

export function isLibraryStaff(user: AuthUser | null) {
  const role = user?.app_metadata.role || user?.user_metadata.role
  return role === "admin" || role === LIBRARIAN_ROLE
}

export function isRequestsAdmin(user: AuthUser | null) {
  return user?.app_metadata.role === REQUESTS_ADMIN_ROLE || user?.user_metadata.role === REQUESTS_ADMIN_ROLE
}

export function canManageCouponRequests(user: AuthUser | null) {
  return isAdmin(user) || isRequestsAdmin(user)
}
