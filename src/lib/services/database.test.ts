import { afterEach, describe, expect, it } from "vitest"
import { createDatabase, createLoan, createRecord, deleteDatabase, getDatabaseById, getRecordsByDatabase, getLoanStats } from "./database"

const createdDatabaseIds: string[] = []

afterEach(async () => {
  for (const databaseId of createdDatabaseIds.splice(0)) {
    await deleteDatabase(databaseId)
  }
})

describe("SQLite database service", () => {
  it("creates and reads a catalog", async () => {
    const database = await createDatabase({ name: `Test ${Date.now()}`, description: "test" })
    createdDatabaseIds.push(database.id)
    expect(database.id).toBeTruthy()
    expect((await getDatabaseById(database.id))?.name).toBe(database.name)
  })

  it("creates and lists a record", async () => {
    const database = await createDatabase({ name: `Records ${Date.now()}` })
    createdDatabaseIds.push(database.id)
    await createRecord({ database_id: database.id, data: { title: "Libro de prueba" } })
    const result = await getRecordsByDatabase(database.id)
    expect(result.records).toHaveLength(1)
    expect(result.records[0].data).toEqual({ title: "Libro de prueba" })
  })

  it("returns loan statistics", async () => {
    const stats = await getLoanStats()
    expect(stats).toEqual(expect.objectContaining({ requested: expect.any(Number), active: expect.any(Number), overdue: expect.any(Number), returned: expect.any(Number) }))
  })

  it("rejects a public request when there are no available copies", async () => {
    const database = await createDatabase({ name: `Unavailable ${Date.now()}` })
    createdDatabaseIds.push(database.id)
    const record = await createRecord({ database_id: database.id, data: { title: "Sin ejemplares" }, disponibles: 0 })

    await expect(createLoan({
      database_id: database.id,
      record_id: record.id,
      borrower_type: "reader",
      borrower_name: "Lector de prueba",
      public_request: true,
    })).rejects.toThrow("NO_AVAILABLE_COPIES")
  })
})
