import { readFile } from "node:fs/promises"
import { join, normalize } from "node:path"
import { NextResponse } from "next/server"

const contentTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = await params
  const relative = normalize(join(...segments.path))
  if (relative.startsWith("..") || relative.includes("..")) return NextResponse.json({ error: "Not found" }, { status: 404 })
  try {
    const file = await readFile(join(process.cwd(), process.env.UPLOADS_DIR || "data/uploads", relative))
    const extension = relative.split(".").pop()?.toLowerCase() || ""
    return new NextResponse(file, { headers: { "Content-Type": contentTypes[extension] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
