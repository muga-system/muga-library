import { NextRequest, NextResponse } from "next/server"
import { createCouponRequest } from "@/lib/services/coupons"
import { sendCouponRequestReceivedEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, libraryName, description } = body

    if (!email || !libraryName) {
      return NextResponse.json(
        { success: false, error: "Email y nombre de biblioteca son requeridos" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Email inválido" },
        { status: 400 }
      )
    }

    // Create request
    const requestData = await createCouponRequest({
      email,
      libraryName,
      description,
    })

    // Send confirmation email
    await sendCouponRequestReceivedEmail(email, libraryName)

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
