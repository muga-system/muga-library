import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const createClient = vi.fn()
vi.mock("@supabase/supabase-js", () => ({
  createClient,
}))

const testEnv = process.env as Record<string, string | undefined>

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  testEnv.NODE_ENV = "development"
  testEnv.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
  testEnv.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key"
  testEnv.ADMIN_BOOTSTRAP_SECRET = "test-bootstrap-secret"
  delete testEnv.ADMIN_EMAIL
  delete testEnv.ADMIN_PASSWORD
})

afterEach(() => {
  delete testEnv.NODE_ENV
  delete testEnv.NEXT_PUBLIC_SUPABASE_URL
  delete testEnv.SUPABASE_SERVICE_ROLE_KEY
  delete testEnv.ADMIN_BOOTSTRAP_SECRET
  delete testEnv.ADMIN_EMAIL
  delete testEnv.ADMIN_PASSWORD
})

function createRequest(secret?: string) {
  return new Request("http://localhost/api/create-admin", {
    method: "POST",
    headers: secret ? { "x-admin-bootstrap-secret": secret } : {},
  })
}

describe("POST /api/create-admin", () => {
  it("returns 404 in production", async () => {
    testEnv.NODE_ENV = "production"

    const { POST } = await import("./route")
    const response = await POST(createRequest("test-bootstrap-secret"))

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.code).toBe("NOT_FOUND")
  })

  it("returns 403 when bootstrap secret is missing or invalid", async () => {
    testEnv.ADMIN_PASSWORD = "strong-password"

    const { POST } = await import("./route")
    const response = await POST(createRequest())

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe("FORBIDDEN")
  })

  it("returns 400 when ADMIN_PASSWORD is missing", async () => {
    testEnv.ADMIN_EMAIL = "admin@example.com"

    const { POST } = await import("./route")
    const response = await POST(createRequest("test-bootstrap-secret"))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain("ADMIN_PASSWORD must be set")
  })

  it("creates the admin user when environment is correct", async () => {
    testEnv.ADMIN_EMAIL = "admin@example.com"
    testEnv.ADMIN_PASSWORD = "strong-password"

    const createUser = vi.fn().mockResolvedValue({ data: { user: { id: "x", email: "admin@example.com" } }, error: null })
    createClient.mockReturnValue({ auth: { admin: { createUser } } })

    const { POST } = await import("./route")
    const response = await POST(createRequest("test-bootstrap-secret"))

    expect(createUser).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "strong-password",
      email_confirm: true,
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).toEqual({ id: "x", email: "admin@example.com" })
  })

  it("returns 400 when createUser returns error", async () => {
    testEnv.ADMIN_EMAIL = "admin@example.com"
    testEnv.ADMIN_PASSWORD = "strong-password"

    const createUser = vi.fn().mockResolvedValue({ data: null, error: { message: "some error" } })
    createClient.mockReturnValue({ auth: { admin: { createUser } } })

    const { POST } = await import("./route")
    const response = await POST(createRequest("test-bootstrap-secret"))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe("ADMIN_CREATE_FAILED")
    expect(body.error).toBe("some error")
  })
})