import { describe, expect, it, vi } from "vitest"
import { GET } from "./route"

const { mockGetCurrentUser } = vi.hoisted(() => ({ mockGetCurrentUser: vi.fn() }))

vi.mock("@/lib/auth/service", () => ({
  getCurrentUser: mockGetCurrentUser,
}))

describe("GET /api/auth/me", () => {
  it("prevents cached authentication state", async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const response = await GET()

    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0")
    expect(response.headers.get("Vary")).toBe("Cookie")
    expect(await response.json()).toEqual({ user: null })
  })
})
