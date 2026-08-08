import { describe, expect, it } from "vitest"
import { createLoanSchema, updateSettingsSchema } from "./schemas"

describe("createLoanSchema", () => {
  it("accepts a community reader request", () => {
    const result = createLoanSchema.safeParse({
      database_id: crypto.randomUUID(),
      record_id: crypto.randomUUID(),
      borrower_type: "reader",
      borrower_name: "María Lectora",
      public_request: true,
    })

    expect(result.success).toBe(true)
  })
})

describe("updateSettingsSchema", () => {
  it("accepts an avatar uploaded to the local storage route", () => {
    const result = updateSettingsSchema.safeParse({
      profile: { avatar_url: "/api/uploads/avatars/user-1/photo.webp" },
    })

    expect(result.success).toBe(true)
  })
})
