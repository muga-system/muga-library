import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCouponRequests, processCouponRequest, getProfileByEmail } from "@/lib/services/coupons"
import { sendCouponApprovedEmail } from "@/lib/email"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function requireAdmin(request: NextRequest): Promise<{ userId: string | null; error: NextResponse | null }> {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "") || request.cookies.get("sb-access-token")?.value

  if (!token) {
    return { userId: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return { userId: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }

  // Check if user is admin
  const profile = await getProfileByEmail(user.email!)
  if (!profile || profile.role !== "admin") {
    return { userId: null, error: NextResponse.json({ error: "Solo administradores" }, { status: 403 }) }
  }

  return { userId: user.id, error: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || undefined

  try {
    const requests = await getCouponRequests(status)
    return NextResponse.json({ success: true, requests })
  } catch (error) {
    console.error("Error fetching coupon requests:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { action, requestId, adminNotes } = body

    if (!requestId || !action) {
      return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 })
    }

    const coupon = await processCouponRequest(requestId, action, auth.userId!, adminNotes)

    // If approved, send email with coupon code
    if (action === "approve" && coupon) {
      const { data: reqData } = await supabaseAdmin
        .from("coupon_requests")
        .select("email, library_name")
        .eq("id", requestId)
        .single()

      if (reqData) {
        await sendCouponApprovedEmail(reqData.email, reqData.library_name, coupon.code)
      }
    }

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error("Error processing coupon request:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { createForEmail, libraryName } = body

    if (!createForEmail || !libraryName) {
      return NextResponse.json({ error: "Email y nombre requeridos" }, { status: 400 })
    }

    const couponCode = generateCouponCode()

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: couponCode,
        created_by: auth.userId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Send email with coupon
    await sendCouponApprovedEmail(createForEmail, libraryName, couponCode)

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
