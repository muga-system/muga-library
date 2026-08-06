import { and, desc, eq, sql } from "drizzle-orm"
import { randomInt } from "node:crypto"
import { db } from "@/lib/db"
import { coupons, couponRequests, databases, profiles } from "@/lib/db/schema"
import { sendCouponApprovedEmail, sendCouponRejectedEmail } from "@/lib/email"

export type Coupon = typeof coupons.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type CouponRequest = typeof couponRequests.$inferSelect

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const coupon = db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).get()
  if (!coupon) return { valid: false, error: "Cupón no encontrado" }
  if (!coupon.isActive) return { valid: false, error: "Cupón desactivado" }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, error: "Cupón expirado" }
  if (coupon.usesCount >= coupon.maxUses) return { valid: false, error: "Cupón ya utilizado" }
  return { valid: true, coupon }
}

export async function createProfile(data: { userId: string; email: string; libraryName: string; libraryDescription?: string; couponId?: string }): Promise<Profile> {
  const [profile] = db.insert(profiles).values({
    id: data.userId,
    email: data.email,
    passwordHash: "managed-by-auth",
    libraryName: data.libraryName,
    libraryDescription: data.libraryDescription || null,
    librarySlug: slugify(data.libraryName),
  }).returning().all()
  return profile
}

export async function markCouponUsed(couponId: string, userId: string) {
  const result = db.update(coupons)
    .set({ usedAt: new Date().toISOString(), userId, usesCount: sql`${coupons.usesCount} + 1` })
    .where(and(eq(coupons.id, couponId), eq(coupons.isActive, true), sql`${coupons.usesCount} < ${coupons.maxUses}`))
    .run()
  if (!result.changes) throw new Error("COUPON_ALREADY_USED")
}

export async function createDatabaseOwner(ownerId: string, data: { name: string; description?: string }) {
  const [database] = db.insert(databases).values({
    name: data.name,
    description: data.description || null,
    ownerId,
    isPublic: false,
    libraryVisibility: "private",
  }).returning({ id: databases.id }).all()
  return database
}

export async function getProfileById(id: string) { return db.select().from(profiles).where(eq(profiles.id, id)).get() || null }
export async function getProfileByEmail(email: string) { return db.select().from(profiles).where(eq(profiles.email, email.toLowerCase())).get() || null }

export async function updateProfileCatalogCount(profileId: string, increment = true) {
  db.update(profiles).set({ catalogsCreated: increment ? sql`${profiles.catalogsCreated} + 1` : 0 }).where(eq(profiles.id, profileId)).run()
}

export async function canCreateCatalog(userId: string) {
  const profile = await getProfileById(userId)
  if (!profile) return { can: false, remaining: 0 }
  const remaining = profile.maxCatalogs - profile.catalogsCreated
  return { can: remaining > 0, remaining: Math.max(0, remaining) }
}

export async function canCreateLibrary(userId: string) {
  const profile = await getProfileById(userId)
  return Boolean(profile && !profile.libraryName)
}

export async function getPublicDatabases() {
  return db.select({ id: databases.id, name: databases.name, description: databases.description, is_public: databases.isPublic, library_visibility: databases.libraryVisibility, catalog_type: databases.catalogType, owner_id: databases.ownerId, created_at: databases.createdAt })
    .from(databases).where(eq(databases.isPublic, true)).orderBy(desc(databases.createdAt)).all()
}

export async function createCouponRequest(data: { email: string; libraryName: string; description?: string }) {
  const [request] = db.insert(couponRequests).values({
    email: data.email.toLowerCase(),
    libraryName: data.libraryName,
    description: data.description || null,
    requestedAt: new Date().toISOString(),
  }).returning().all()
  return request
}

export async function getCouponRequests(status?: string) {
  const condition = status ? eq(couponRequests.status, status) : undefined
  return db.select().from(couponRequests).where(condition).orderBy(desc(couponRequests.requestedAt)).all()
}

export type ProcessCouponRequestResult = {
  coupon: Coupon | null
  emailSent: boolean
}

export async function processCouponRequest(requestId: string, action: "approve" | "reject", adminId: string, adminNotes?: string): Promise<ProcessCouponRequestResult> {
  const request = db.select().from(couponRequests).where(eq(couponRequests.id, requestId)).get()
  if (!request) throw new Error("Solicitud no encontrada")
  if (request.status !== "pending") throw new Error("REQUEST_ALREADY_PROCESSED")
  const processedAt = new Date().toISOString()
  if (action === "reject") {
    const result = db.update(couponRequests).set({ status: "rejected", processedBy: adminId, processedAt, adminNotes: adminNotes || null }).where(and(eq(couponRequests.id, requestId), eq(couponRequests.status, "pending"))).run()
    if (!result.changes) throw new Error("REQUEST_ALREADY_PROCESSED")
    const emailSent = await sendCouponRejectedEmail(request.email, request.libraryName, adminNotes || "No se indicó un motivo específico.")
    return { coupon: null, emailSent }
  }
  const couponCode = generateCouponCode()
  const [coupon] = db.insert(coupons).values({ code: couponCode, createdBy: adminId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).returning().all()
  const result = db.update(couponRequests).set({ status: "approved", processedBy: adminId, processedAt, adminNotes: `Cupón generado: ${couponCode}. ${adminNotes || ""}` }).where(and(eq(couponRequests.id, requestId), eq(couponRequests.status, "pending"))).run()
  if (!result.changes) throw new Error("REQUEST_ALREADY_PROCESSED")
  const emailSent = await sendCouponApprovedEmail(request.email, request.libraryName, couponCode)
  return { coupon, emailSent }
}

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: 16 }, (_, index) => index > 0 && index % 4 === 0 ? `-${chars[randomInt(chars.length)]}` : chars[randomInt(chars.length)]).join("")
}

export async function getAdminProfiles() { return db.select().from(profiles).where(eq(profiles.role, "admin")).all() }
