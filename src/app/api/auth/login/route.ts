import { NextResponse } from "next/server"
import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth/service"
import { parseJsonBody } from "@/lib/api/http"
import { loginSchema } from "@/lib/api/schemas"
import { rateLimit } from "@/lib/security/rate-limit"

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth-login", 10, 15 * 60 * 1000)
  if (limited) return limited
  const parsed = await parseJsonBody(request, loginSchema, { maxBytes: 16 * 1024 })
  if (!parsed.success) return parsed.response
  const { email, password } = parsed.data
  const user = await authenticateUser(email, password)

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials", code: "AUTH_INVALID" }, { status: 401 })
  }

  const session = createSession(user.id)
  await setSessionCookie(session.sessionId, session.expiresAt)
  return NextResponse.json({ user })
}
