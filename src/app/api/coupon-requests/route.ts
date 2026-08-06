import { NextRequest, NextResponse } from "next/server"
import { createCouponRequest } from "@/lib/services/coupons"
import {
  sendCouponRequestAdminNotificationEmail,
  sendCouponRequestReceivedEmail,
} from "@/lib/email"
import { parseJsonBody } from "@/lib/api/http"
import { couponRequestSchema } from "@/lib/api/schemas"
import { rateLimit } from "@/lib/security/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "coupon-request", 5, 15 * 60 * 1000)
    if (limited) return limited
    const parsed = await parseJsonBody(request, couponRequestSchema, { maxBytes: 32 * 1024 })
    if (!parsed.success) return parsed.response
    const { email, libraryName, description } = parsed.data

    const requestData = await createCouponRequest({
      email,
      libraryName,
      description,
    })

    const [requesterEmailSent, adminEmailSent] = await Promise.all([
      sendCouponRequestReceivedEmail(email, libraryName),
      sendCouponRequestAdminNotificationEmail(email, libraryName, description),
    ])

    console.log("📧 [COUPON REQUEST] Email delivery:", {
      requesterEmailSent,
      adminEmailSent,
    })

    if (!requesterEmailSent || !adminEmailSent) {
      return NextResponse.json(
        {
          success: false,
          error: "La solicitud fue guardada, pero no se pudieron enviar los emails. Revisá la configuración de Hostinger Mail.",
          requestId: requestData.id,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada. Te notificaremos cuando sea procesada.",
      requestId: requestData.id,
    })
  } catch (error) {
    console.error("Error creating coupon request:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
