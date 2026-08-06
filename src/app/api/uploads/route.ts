import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/service"

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"]])
const limits = { avatar: 3 * 1024 * 1024, cover: 5 * 1024 * 1024 }

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "No autorizado", code: "AUTH_REQUIRED" }, { status: 401 })

  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > 6 * 1024 * 1024) return NextResponse.json({ error: "Archivo demasiado grande", code: "FILE_TOO_LARGE" }, { status: 413 })

  const form = await request.formData()
  const file = form.get("file")
  const requestedKind = form.get("kind")
  if (requestedKind !== "avatar" && requestedKind !== "cover") return NextResponse.json({ error: "Tipo de archivo inválido", code: "FILE_KIND_INVALID" }, { status: 400 })
  const kind = requestedKind
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido", code: "FILE_REQUIRED" }, { status: 400 })
  const extension = allowed.get(file.type)
  if (!extension) return NextResponse.json({ error: "Formato no soportado", code: "FILE_TYPE_INVALID" }, { status: 400 })
  if (file.size > limits[kind]) return NextResponse.json({ error: "Archivo demasiado grande", code: "FILE_TOO_LARGE" }, { status: 413 })

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const signatures: Record<string, (value: Uint8Array) => boolean> = {
    "image/jpeg": (value) => value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff,
    "image/png": (value) => value.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]),
    "image/webp": (value) => String.fromCharCode(...value.slice(0, 4)) === "RIFF" && String.fromCharCode(...value.slice(8, 12)) === "WEBP",
    "image/gif": (value) => String.fromCharCode(...value.slice(0, 6)) === "GIF87a" || String.fromCharCode(...value.slice(0, 6)) === "GIF89a",
  }
  if (!signatures[file.type]?.(bytes)) return NextResponse.json({ error: "El contenido no coincide con el formato declarado", code: "FILE_CONTENT_INVALID" }, { status: 400 })

  const filename = `${crypto.randomUUID()}.${extension}`
  const relativeDirectory = join(kind === "avatar" ? "avatars" : "book-covers", user.id)
  const directory = join(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOADS_DIR || "data/uploads", relativeDirectory)
  await mkdir(directory, { recursive: true })
  await writeFile(join(/* turbopackIgnore: true */ directory, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/api/uploads/${relativeDirectory.replaceAll("\\", "/")}/${filename}` }, { status: 201, headers: { "X-Content-Type-Options": "nosniff" } })
}
