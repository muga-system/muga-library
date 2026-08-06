import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { NextResponse } from "next/server"
import { sqlite } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    sqlite.prepare("select 1").get()
    await mkdir(join(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOADS_DIR || "data/uploads"), { recursive: true })
    return NextResponse.json({ ok: true, service: "muga-library" }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, service: "muga-library" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
