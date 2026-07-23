import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { createUser } from "@/lib/auth/service"
import { validateCoupon, markCouponUsed, createDatabaseOwner } from "@/lib/services/coupons"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email, libraryName, libraryDescription } = body
    if (!code || !email || !libraryName) return NextResponse.json({ success: false, error: "Código, email y nombre de biblioteca son requeridos" }, { status: 400 })
    const result = await validateCoupon(code)
    if (!result.valid || !result.coupon) return NextResponse.json({ success: false, error: result.error || "Cupón inválido" }, { status: 400 })
    const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    const user = await createUser(email, tempPassword, "librarian")
    db.update(profiles).set({ libraryName, libraryDescription: libraryDescription || null, librarySlug: libraryName.toLowerCase().replace(/\s+/g, "-") }).where(eq(profiles.id, user.id)).run()
    await createDatabaseOwner(user.id, { name: libraryName, description: libraryDescription })
    await markCouponUsed(result.coupon.id, user.id)
    return NextResponse.json({ success: true, message: "Biblioteca activada.", username: email, temporaryPassword: tempPassword })
  } catch (error) {
    const message = error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED" ? "Este email ya está registrado" : "Error interno del servidor"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
