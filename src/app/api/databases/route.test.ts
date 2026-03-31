import { beforeEach, describe, expect, it, vi } from "vitest"

const requireApiUser = vi.fn()
const getAllDatabases = vi.fn()
const createDatabase = vi.fn()

vi.mock("@/lib/api/auth", () => ({
  requireApiUser,
}))

vi.mock("@/lib/services/database", () => ({
  getAllDatabases,
  createDatabase,
}))

describe("/api/databases route", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns 401 when user is not authenticated", async () => {
    requireApiUser.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Authentication required", code: "AUTH_REQUIRED" }, { status: 401 }),
    })

    const { GET } = await import("./route")
    const response = await GET()

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.code).toBe("AUTH_REQUIRED")
  })

  it("returns 400 on invalid payload", async () => {
    requireApiUser.mockResolvedValue({
      ok: true,
      user: { id: "user-id" },
    })

    const { POST } = await import("./route")
    const response = await POST(
      new Request("http://localhost/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      }),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe("VALIDATION_ERROR")
  })

  it("creates database with valid payload", async () => {
    requireApiUser.mockResolvedValue({
      ok: true,
      user: { id: "user-id" },
    })
    createDatabase.mockResolvedValue({ id: "db-1", name: "Catalogo", description: "desc" })

    const { POST } = await import("./route")
    const response = await POST(
      new Request("http://localhost/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Catalogo", description: "desc" }),
      }),
    )

    expect(response.status).toBe(201)
    expect(createDatabase).toHaveBeenCalledWith({ name: "Catalogo", description: "desc" })
  })
})