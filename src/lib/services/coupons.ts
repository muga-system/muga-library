import { supabaseAdmin } from "./database"

export interface Coupon {
  id: string
  code: string
  is_active: boolean
  used_at: string | null
  user_id: string | null
  max_uses: number
  uses_count: number
  created_by: string | null
  created_at: string
  expires_at: string | null
}

export interface Profile {
  id: string
  email: string
  library_name: string | null
  library_description: string | null
  library_slug: string | null
  coupon_id: string | null
  max_catalogs: number
  catalogs_created: number
  is_active: boolean
  role: string
  created_at: string
  updated_at: string
}

export interface CouponRequest {
  id: string
  email: string
  library_name: string
  description: string | null
  status: string
  requested_at: string
  processed_by: string | null
  processed_at: string | null
  admin_notes: string | null
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .single()

  if (error || !coupon) {
    return { valid: false, error: "Cupón no encontrado" }
  }

  if (!coupon.is_active) {
    return { valid: false, error: "Cupón desactivado" }
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "Cupón expirado" }
  }

  if (coupon.used_at && coupon.uses_count >= coupon.max_uses) {
    return { valid: false, error: "Cupón ya utilizado" }
  }

  return { valid: true, coupon }
}

export async function createProfile(data: {
  userId: string
  email: string
  libraryName: string
  libraryDescription?: string
  couponId?: string
}): Promise<Profile> {
  const slug = data.libraryName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 50)

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: data.userId,
      email: data.email,
      library_name: data.libraryName,
      library_description: data.libraryDescription || null,
      library_slug: slug,
      coupon_id: data.couponId || null,
      max_catalogs: 2,
      catalogs_created: 0,
      is_active: true,
      role: "librarian",
    })
    .select()
    .single()

  if (error) throw error
  return profile
}

export async function markCouponUsed(couponId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("coupons")
    .update({
      used_at: new Date().toISOString(),
      user_id: userId,
      uses_count: 1,
    })
    .eq("id", couponId)

  if (error) throw error
}

export async function createDatabaseOwner(
  ownerId: string,
  data: { name: string; description?: string }
): Promise<{ id: string }> {
  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 50)

  const { data: database, error } = await supabaseAdmin
    .from("databases")
    .insert({
      name: data.name,
      description: data.description || null,
      owner_id: ownerId,
      is_public: true,
      library_visibility: "public",
    })
    .select("id")
    .single()

  if (error) throw error
  return database
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single()

  if (error) return null
  return data
}

export async function updateProfileCatalogCount(profileId: string, increment: boolean = true): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      catalogs_created: increment ? 1 : 0,
    })
    .eq("id", profileId)

  if (error) throw error
}

export async function canCreateCatalog(userId: string): Promise<{ can: boolean; remaining: number }> {
  const profile = await getProfileById(userId)
  if (!profile) return { can: false, remaining: 0 }

  const remaining = profile.max_catalogs - profile.catalogs_created
  return { can: remaining > 0, remaining: Math.max(0, remaining) }
}

export async function canCreateLibrary(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId)
  if (!profile) return false

  return !profile.library_name || profile.library_name === ""
}

export async function getPublicDatabases() {
  const { data, error } = await supabaseAdmin
    .from("databases")
    .select(`
      id,
      name,
      description,
      is_public,
      library_visibility,
      catalog_type,
      owner_id,
      profiles!inner(email, library_name)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createCouponRequest(data: {
  email: string
  libraryName: string
  description?: string
}): Promise<CouponRequest> {
  const { data: request, error } = await supabaseAdmin
    .from("coupon_requests")
    .insert({
      email: data.email,
      library_name: data.libraryName,
      description: data.description || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return request
}

export async function getCouponRequests(status?: string) {
  let query = supabaseAdmin.from("coupon_requests").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("requested_at", { ascending: false })

  if (error) throw error
  return data
}

export async function processCouponRequest(
  requestId: string,
  action: "approve" | "reject",
  adminId: string,
  adminNotes?: string
): Promise<Coupon | null> {
  const { data: request } = await supabaseAdmin
    .from("coupon_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (!request) throw new Error("Solicitud no encontrada")

  if (action === "reject") {
    await supabaseAdmin
      .from("coupon_requests")
      .update({
        status: "rejected",
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq("id", requestId)

    return null
  }

  const couponCode = generateCouponCode()

  const { data: coupon } = await supabaseAdmin
    .from("coupons")
    .insert({
      code: couponCode,
      created_by: adminId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  await supabaseAdmin
    .from("coupon_requests")
    .update({
      status: "approved",
      processed_by: adminId,
      processed_at: new Date().toISOString(),
      admin_notes: `Cupón generado: ${couponCode}. ${adminNotes || ""}`,
    })
    .eq("id", requestId)

  return coupon
}

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function getAdminProfiles() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("role", "admin")

  if (error) throw error
  return data
}
