import { createClient as createAdminClient } from "@supabase/supabase-js"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess } from "@/lib/api/http"

export async function POST() {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase service role is not configured")
  }

  const supabase = createAdminClient(url, serviceRoleKey)

  const existing = await supabase.storage.getBucket("book-covers")
  if (!existing.error && existing.data) {
    return apiSuccess({ ok: true, created: false })
  }

  const created = await supabase.storage.createBucket("book-covers", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  })

  if (created.error) {
    return apiError(500, "BOOK_COVERS_BUCKET_CREATE_FAILED", created.error.message)
  }

  return apiSuccess({ ok: true, created: true })
}
