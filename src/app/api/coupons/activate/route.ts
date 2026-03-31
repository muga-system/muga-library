import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateCoupon, createProfile, markCouponUsed, createDatabaseOwner } from "@/lib/services/coupons"
import { sendCredentialsEmail } from "@/lib/email"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function generateTempPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateUsername(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
  const suffix = Math.floor(Math.random() * 9000 + 1000)
  return `${base}${suffix}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email, libraryName, libraryDescription } = body

    if (!code || !email || !libraryName) {
      return NextResponse.json(
        { success: false, error: "Código, email y nombre de biblioteca son requeridos" },
        { status: 400 }
      )
    }

    // Validate coupon
    const result = await validateCoupon(code)
    if (!result.valid || !result.coupon) {
      return NextResponse.json(
        { success: false, error: result.error || "Cupón inválido" },
        { status: 400 }
      )
    }

    // Check if email already exists - try to find user by email
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = usersList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Este email ya está registrado" },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const username = generateUsername(email)

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        username,
        libraryName,
      },
    })

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError)
      return NextResponse.json(
        { success: false, error: "Error al crear usuario" },
        { status: 500 }
      )
    }

    // Create profile
    const profile = await createProfile({
      userId: authData.user.id,
      email,
      libraryName,
      libraryDescription,
      couponId: result.coupon.id,
    })

    // Create default database for the library
    const database = await createDatabaseOwner(authData.user.id, {
      name: libraryName,
      description: libraryDescription,
    })

    // Mark coupon as used
    await markCouponUsed(result.coupon.id, authData.user.id)

    // Send email with credentials
    await sendCredentialsEmail(email, username, tempPassword, libraryName)

    return NextResponse.json({
      success: true,
      message: "Biblioteca activada. Credenciales enviadas por email.",
      username,
    })
  } catch (error) {
    console.error("Error activating coupon:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
