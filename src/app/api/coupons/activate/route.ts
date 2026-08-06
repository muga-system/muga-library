import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { createUser } from "@/lib/auth/service"
import { validateCoupon, markCouponUsed, createDatabaseOwner } from "@/lib/services/coupons"
import { sendCredentialsEmail } from "@/lib/email"
import { apiError, parseJsonBody } from "@/lib/api/http"
import { activateCouponSchema } from "@/lib/api/schemas"
import { rateLimit } from "@/lib/security/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "coupon-activate", 10, 15 * 60 * 1000)
    if (limited) return limited
    const parsed = await parseJsonBody(request, activateCouponSchema, { maxBytes: 16 * 1024 })
    if (!parsed.success) return parsed.response

    const { code, email, libraryName, libraryDescription } = parsed.data
    const result = await validateCoupon(code)
    if (!result.valid || !result.coupon) return NextResponse.json({ success: false, error: result.error || "Cupón inválido" }, { status: 400 })
    const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    const user = await createUser(email, tempPassword, "librarian")
    db.update(profiles).set({ libraryName, libraryDescription: libraryDescription || null, librarySlug: libraryName.toLowerCase().replace(/\s+/g, "-") }).where(eq(profiles.id, user.id)).run()
    await createDatabaseOwner(user.id, { name: libraryName, description: libraryDescription })
    await markCouponUsed(result.coupon.id, user.id)
    const emailSent = await sendCredentialsEmail(email, email, tempPassword, libraryName)
    return NextResponse.json({
      success: true,
      message: emailSent ? "Biblioteca activada y credenciales enviadas." : "Biblioteca activada. Guardá estas credenciales y configurá el correo SMTP.",
      username: email.trim().toLowerCase(),
      emailSent,
      temporaryPassword: emailSent ? undefined : tempPassword,
    })
  } catch (error) {
    const message = error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED" ? "Este email ya está registrado" : "Error interno del servidor"
    return apiError(message === "Este email ya está registrado" ? 409 : 400, "ACTIVATION_FAILED", message)
  }
}
