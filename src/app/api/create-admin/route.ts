import { NextResponse } from "next/server"
import { createUser } from "@/lib/auth/service"

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 })
  }

  if (process.env.ADMIN_BOOTSTRAP_ENABLED !== "true") {
    return NextResponse.json({ error: "Admin bootstrap is disabled", code: "BOOTSTRAP_DISABLED" }, { status: 403 })
  }

  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET
  const providedSecret = request.headers.get("x-admin-bootstrap-secret")
  if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const password = process.env.ADMIN_PASSWORD || ""
  if (!password) {
    return NextResponse.json({ error: "ADMIN_PASSWORD must be set", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  try {
    const user = await createUser(process.env.ADMIN_EMAIL || "admin@example.com", password, "admin")
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "ADMIN_CREATE_FAILED"
    return NextResponse.json({ error: message, code: "ADMIN_CREATE_FAILED" }, { status: 400 })
  }
}
