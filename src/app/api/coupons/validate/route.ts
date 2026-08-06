import { NextRequest, NextResponse } from "next/server"
import { validateCoupon } from "@/lib/services/coupons"
import { rateLimit } from "@/lib/security/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "coupon-validate", 20, 15 * 60 * 1000)
    if (limited) return limited
    const body = await request.json()
    const code = typeof body?.code === "string" ? body.code.trim().slice(0, 100) : ""

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Código requerido" },
        { status: 400 }
      )
    }

    const result = await validateCoupon(code)

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "Cupón válido",
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
