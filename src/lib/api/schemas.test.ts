import { describe, expect, it } from "vitest"
import { createLoanSchema } from "./schemas"

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
