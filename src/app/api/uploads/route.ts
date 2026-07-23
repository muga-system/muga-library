import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/service"

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"]])
const limits = { avatar: 3 * 1024 * 1024, cover: 5 * 1024 * 1024 }

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "No autorizado", code: "AUTH_REQUIRED" }, { status: 401 })

  const form = await request.formData()
  const file = form.get("file")
  const kind = form.get("kind") === "avatar" ? "avatar" : "cover"
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido", code: "FILE_REQUIRED" }, { status: 400 })
  const extension = allowed.get(file.type)
  if (!extension) return NextResponse.json({ error: "Formato no soportado", code: "FILE_TYPE_INVALID" }, { status: 400 })
  if (file.size > limits[kind]) return NextResponse.json({ error: "Archivo demasiado grande", code: "FILE_TOO_LARGE" }, { status: 413 })

  const filename = `${crypto.randomUUID()}.${extension}`
  const relativeDirectory = join(kind === "avatar" ? "avatars" : "book-covers", user.id)
  const directory = join(process.cwd(), process.env.UPLOADS_DIR || "data/uploads", relativeDirectory)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/api/uploads/${relativeDirectory.replaceAll("\\", "/")}/${filename}` }, { status: 201 })
}
