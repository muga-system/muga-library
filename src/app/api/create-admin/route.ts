import { createClient } from "@supabase/supabase-js"
import { apiError, apiSuccess } from "@/lib/api/http"

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return apiError(404, "NOT_FOUND", "Not found")
  }

  if (process.env.ADMIN_BOOTSTRAP_ENABLED !== "true") {
    return apiError(403, "BOOTSTRAP_DISABLED", "Admin bootstrap is disabled")
  }

  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET
  if (!bootstrapSecret) {
    return apiError(503, "BOOTSTRAP_NOT_CONFIGURED", "Admin bootstrap endpoint is not configured")
  }

  const providedSecret = request.headers.get("x-admin-bootstrap-secret")
  if (!providedSecret || providedSecret !== bootstrapSecret) {
    return apiError(403, "FORBIDDEN", "Forbidden")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase URL and service role key must be set")
  }

  const email = process.env.ADMIN_EMAIL || "admin@example.com"
  const password = process.env.ADMIN_PASSWORD || ""

  if (!password) {
    return apiError(400, "VALIDATION_ERROR", "ADMIN_PASSWORD must be set in environment variables for admin creation")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role: "admin",
    },
    user_metadata: {
      role: "admin",
    },
  })

  if (error) {
    return apiError(400, "ADMIN_CREATE_FAILED", error.message)
  }

  return apiSuccess({ user: data.user })
}
