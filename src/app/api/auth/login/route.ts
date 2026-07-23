import { NextResponse } from "next/server"
import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth/service"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const user = await authenticateUser(email, password)

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials", code: "AUTH_INVALID" }, { status: 401 })
  }

  const session = createSession(user.id)
  await setSessionCookie(session.sessionId, session.expiresAt)
  return NextResponse.json({ user })
}
