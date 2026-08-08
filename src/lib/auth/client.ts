export type ClientUser = {
  id: string
  email: string
  app_metadata: { role: string }
  user_metadata: {
    role: string
    full_name?: string
    avatar_url?: string
  }
}

type AuthResponse = { user?: ClientUser; error?: { message: string; code?: string } }

async function request(path: string, options?: RequestInit): Promise<AuthResponse> {
  try {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return { error: { message: body.error || "Authentication failed", code: body.code } }
    return body
  } catch {
    return { error: { message: "No se pudo conectar con el servidor", code: "NETWORK_ERROR" } }
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  return { data: result.user ? { user: result.user, session: { user: result.user } } : null, error: result.error || null }
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  return { data: result.user ? { user: result.user, session: { user: result.user } } : null, error: result.error || null }
}

export async function signOut() {
  const result = await request("/api/auth/logout", { method: "POST" })
  return { error: result.error || null }
}

export async function getCurrentUser() {
  const result = await request("/api/auth/me")
  return { user: result.user || null, error: result.error || null }
}
