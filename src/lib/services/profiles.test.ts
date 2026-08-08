import { afterEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { createUser } from "@/lib/auth/service"
import { getProfileById, updateProfile } from "./profiles"

const createdProfileIds: string[] = []

afterEach(() => {
  for (const id of createdProfileIds.splice(0)) {
    db.delete(profiles).where(eq(profiles.id, id)).run()
  }
})

describe("profile service", () => {
  it("persists a locally uploaded avatar URL", async () => {
    const user = await createUser(`avatar-${Date.now()}@example.com`, "password123")
    createdProfileIds.push(user.id)
    const avatarUrl = `/api/uploads/avatars/${user.id}/photo.webp`

    await updateProfile(user.id, { avatarUrl })

    expect((await getProfileById(user.id))?.avatarUrl).toBe(avatarUrl)
  })
})
