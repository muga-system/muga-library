import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ user: await getCurrentUser() })
}
