import { describe, expect, it, beforeEach } from "vitest"
import { POST } from "./route"

describe("POST /api/create-admin", () => {
  beforeEach(() => {
    const env = process.env as Record<string, string | undefined>
    env.NODE_ENV = "development"
    env.ADMIN_BOOTSTRAP_ENABLED = "true"
    env.ADMIN_BOOTSTRAP_SECRET = "test-secret"
    delete env.ADMIN_PASSWORD
  })

  it("rejects a missing secret", async () => {
    const response = await POST(new Request("http://localhost/api/create-admin", { method: "POST" }))
    expect(response.status).toBe(403)
  })

  it("requires an admin password", async () => {
    const response = await POST(new Request("http://localhost/api/create-admin", { method: "POST", headers: { "x-admin-bootstrap-secret": "test-secret" } }))
    expect(response.status).toBe(400)
  })
})
