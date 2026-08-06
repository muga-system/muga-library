import { compare, hash } from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

export type SafeProfile = {
  id: string
  email: string
  fullName: string
  avatarUrl: string
  libraryName: string
  libraryDescription: string
  librarySlug: string
  role: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function toSafeProfile(profile: typeof profiles.$inferSelect): SafeProfile {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName || "",
    avatarUrl: profile.avatarUrl || "",
    libraryName: profile.libraryName || "",
    libraryDescription: profile.libraryDescription || "",
    librarySlug: profile.librarySlug || "",
    role: profile.role,
  }
}

export async function getProfileById(id: string) {
  const profile = db.select().from(profiles).where(eq(profiles.id, id)).get()
  return profile ? toSafeProfile(profile) : null
}

export async function updateProfile(
  id: string,
  data: {
    fullName?: string
    libraryName?: string
    avatarUrl?: string
    email?: string
    password?: string
    currentPassword?: string
  },
) {
  const current = db.select().from(profiles).where(eq(profiles.id, id)).get()
  if (!current) throw new Error("PROFILE_NOT_FOUND")

  if (data.email || data.password) {
    if (!data.currentPassword || !(await compare(data.currentPassword, current.passwordHash))) {
      throw new Error("CURRENT_PASSWORD_INVALID")
    }
  }

  const normalizedEmail = data.email ? normalizeEmail(data.email) : undefined
  if (normalizedEmail && normalizedEmail !== current.email) {
    const existing = db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, normalizedEmail)).get()
    if (existing && existing.id !== id) throw new Error("EMAIL_ALREADY_REGISTERED")
  }

  const passwordHash = data.password ? await hash(data.password, 12) : undefined
  const [updated] = db.update(profiles).set({
    fullName: data.fullName,
    libraryName: data.libraryName,
    avatarUrl: data.avatarUrl,
    email: normalizedEmail,
    passwordHash,
    updatedAt: new Date().toISOString(),
  }).where(eq(profiles.id, id)).returning().all()

  return toSafeProfile(updated)
}
