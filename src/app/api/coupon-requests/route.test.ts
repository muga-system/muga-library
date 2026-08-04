import type { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createCouponRequest: vi.fn(),
  sendCouponRequestReceivedEmail: vi.fn(),
  sendCouponRequestAdminNotificationEmail: vi.fn(),
}))

vi.mock("@/lib/services/coupons", () => ({
  createCouponRequest: mocks.createCouponRequest,
}))

vi.mock("@/lib/email", () => ({
  sendCouponRequestReceivedEmail: mocks.sendCouponRequestReceivedEmail,
  sendCouponRequestAdminNotificationEmail: mocks.sendCouponRequestAdminNotificationEmail,
}))

import { POST } from "./route"

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/coupon-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe("POST /api/coupon-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createCouponRequest.mockResolvedValue({ id: "request-1" })
    mocks.sendCouponRequestReceivedEmail.mockResolvedValue(true)
    mocks.sendCouponRequestAdminNotificationEmail.mockResolvedValue(true)
  })

  it("sends confirmation and administrative notification after saving the request", async () => {
    const response = await POST(makeRequest({
      email: "biblioteca@example.com",
      libraryName: "Biblioteca Aguapey",
      description: "Biblioteca comunitaria",
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ success: true, requestId: "request-1" })
    expect(mocks.sendCouponRequestReceivedEmail).toHaveBeenCalledWith(
      "biblioteca@example.com",
      "Biblioteca Aguapey"
    )
    expect(mocks.sendCouponRequestAdminNotificationEmail).toHaveBeenCalledWith(
      "biblioteca@example.com",
      "Biblioteca Aguapey",
      "Biblioteca comunitaria"
    )
  })

  it("reports a delivery failure instead of returning a false success", async () => {
    mocks.sendCouponRequestAdminNotificationEmail.mockResolvedValue(false)

    const response = await POST(makeRequest({
      email: "biblioteca@example.com",
      libraryName: "Biblioteca Aguapey",
    }))
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toMatchObject({
      success: false,
      requestId: "request-1",
    })
    expect(body.error).toContain("no se pudieron enviar los emails")
  })
})
