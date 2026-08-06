import { NextResponse } from "next/server"
import { createSession, createUser, setSessionCookie } from "@/lib/auth/service"
import { parseJsonBody } from "@/lib/api/http"
import { registerSchema } from "@/lib/api/schemas"
import { rateLimit } from "@/lib/security/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth-register", 5, 15 * 60 * 1000)
  if (limited) return limited
  const parsed = await parseJsonBody(request, registerSchema, { maxBytes: 16 * 1024 })
  if (!parsed.success) return parsed.response
  const { email, password } = parsed.data

  try {
    const user = await createUser(email, password)
    const session = createSession(user.id)
    await setSessionCookie(session.sessionId, session.expiresAt)
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : "REGISTER_FAILED"
    const status = code === "EMAIL_ALREADY_REGISTERED" ? 409 : 400
    return NextResponse.json({ error: code, code }, { status })
  }
}
