import { NextResponse } from "next/server"
import { createSession, createUser, setSessionCookie } from "@/lib/auth/service"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email : ""
  const password = typeof body?.password === "string" ? body.password : ""

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
