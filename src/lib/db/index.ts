import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

function getDatabasePath() {
  const configured = process.env.DATABASE_URL || "file:./data/muga-library.db"
  const path = configured.startsWith("file:") ? configured.slice(5) : configured
  return resolve(/* turbopackIgnore: true */ process.cwd(), path)
}

const databasePath = getDatabasePath()
mkdirSync(dirname(databasePath), { recursive: true })

const sqlite = new Database(databasePath)
sqlite.pragma("foreign_keys = ON")
sqlite.pragma("journal_mode = WAL")

export const db = drizzle(sqlite, { schema })
export { sqlite }
