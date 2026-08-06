import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { canManageCouponRequests, getCurrentUser } from "@/lib/auth/service"
import { getCouponRequests, processCouponRequest } from "@/lib/services/coupons"
import { parseJsonBody } from "@/lib/api/http"
import { manualCouponSchema, processCouponRequestSchema } from "@/lib/api/schemas"

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { user: null, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  if (!canManageCouponRequests(user)) return { user: null, response: NextResponse.json({ error: "No tenés permisos para administrar incorporaciones" }, { status: 403 }) }
  return { user, response: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const status = new URL(request.url).searchParams.get("status") || undefined
  return NextResponse.json({ success: true, requests: await getCouponRequests(status) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const parsed = await parseJsonBody(request, processCouponRequestSchema, { maxBytes: 32 * 1024 })
  if (!parsed.success) return parsed.response
  try {
    const result = await processCouponRequest(parsed.data.requestId, parsed.data.action, auth.user!.id, parsed.data.adminNotes)
    return NextResponse.json({ success: true, coupon: result.coupon, emailSent: result.emailSent })
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_ALREADY_PROCESSED") return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 409 })
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const parsed = await parseJsonBody(request, manualCouponSchema, { maxBytes: 16 * 1024 })
  if (!parsed.success) return parsed.response
  const [coupon] = db.insert(coupons).values({ code: crypto.randomUUID().slice(0, 8).toUpperCase(), createdBy: auth.user!.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).returning().all()
  return NextResponse.json({ success: true, coupon }, { status: 201 })
}
