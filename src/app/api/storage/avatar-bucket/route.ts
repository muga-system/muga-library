import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess } from "@/lib/api/http"

export async function POST() {
  const auth = await requireApiAdmin(); if (!auth.ok) return auth.response
  try { mkdirSync(join(process.cwd(), process.env.UPLOADS_DIR || "data/uploads", "avatars"), { recursive: true }); return apiSuccess({ ok: true, created: true }) }
  catch { return apiError(500, "AVATAR_STORAGE_CREATE_FAILED", "Could not prepare avatar storage") }
}
