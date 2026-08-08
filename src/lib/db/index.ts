import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import type { Database as BetterSqliteDatabase } from "better-sqlite3"
import { NodeSqliteDatabase } from "./node-sqlite"
import * as schema from "./schema"

function getDatabasePath() {
  const configured = process.env.DATABASE_URL || "file:./data/muga-library.db"
  const path = configured.startsWith("file:") ? configured.slice(5) : configured
  return resolve(/* turbopackIgnore: true */ process.cwd(), path)
}

const databasePath = getDatabasePath()
mkdirSync(dirname(databasePath), { recursive: true })

const sqlite = new NodeSqliteDatabase(databasePath)
sqlite.pragma("foreign_keys = ON")
if (process.env.NEXT_PHASE !== "phase-production-build") {
  sqlite.pragma("journal_mode = WAL")
}

export const db = drizzle(sqlite as unknown as BetterSqliteDatabase, { schema })

if (process.env.NEXT_PHASE !== "phase-production-build" && process.env.NODE_ENV !== "test") {
  migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") })
}

export { sqlite }
