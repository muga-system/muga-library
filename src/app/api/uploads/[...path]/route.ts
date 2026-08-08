import { readFile } from "node:fs/promises"
import { join, resolve, sep } from "node:path"
import { NextResponse } from "next/server"
import { getUploadsDirectory } from "@/lib/storage"

export const dynamic = "force-dynamic"

const contentTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = await params
  const root = resolve(getUploadsDirectory())
  const filePath = resolve(/* turbopackIgnore: true */ root, join(...segments.path))
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) return NextResponse.json({ error: "Not found" }, { status: 404 })
  try {
    const file = await readFile(filePath)
    const extension = filePath.split(".").pop()?.toLowerCase() || ""
    const contentType = contentTypes[extension]
    if (!contentType) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return new NextResponse(file, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
