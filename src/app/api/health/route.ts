import { mkdir } from "node:fs/promises"
import { NextResponse } from "next/server"
import { sqlite } from "@/lib/db"
import { getUploadsDirectory } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    sqlite.prepare("select 1").get()
    await mkdir(getUploadsDirectory(), { recursive: true })
    return NextResponse.json({ ok: true, service: "muga-library" }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, service: "muga-library" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
