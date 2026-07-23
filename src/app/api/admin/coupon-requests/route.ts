import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { getCurrentUser, isAdmin } from "@/lib/auth/service"
import { getCouponRequests, processCouponRequest } from "@/lib/services/coupons"

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { user: null, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  if (!isAdmin(user)) return { user: null, response: NextResponse.json({ error: "Solo administradores" }, { status: 403 }) }
  return { user, response: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const status = new URL(request.url).searchParams.get("status") || undefined
  return NextResponse.json({ success: true, requests: await getCouponRequests(status) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const body = await request.json().catch(() => ({}))
  if (!body.requestId || !body.action) return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 })
  const coupon = await processCouponRequest(body.requestId, body.action, auth.user!.id, body.adminNotes)
  return NextResponse.json({ success: true, coupon })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const body = await request.json().catch(() => ({}))
  if (!body.createForEmail || !body.libraryName) return NextResponse.json({ error: "Email y nombre requeridos" }, { status: 400 })
  const [coupon] = db.insert(coupons).values({ code: crypto.randomUUID().slice(0, 8).toUpperCase(), createdBy: auth.user!.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).returning().all()
  return NextResponse.json({ success: true, coupon }, { status: 201 })
}
