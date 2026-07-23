import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/service"

export async function GET() {
  return NextResponse.json({ user: await getCurrentUser() })
}
