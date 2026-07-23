import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { db } from "../src/lib/db/index"

migrate(db, { migrationsFolder: "./drizzle" })
console.log("SQLite migrations applied.")
