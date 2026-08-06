import { cp, mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import Database from "better-sqlite3"

function dataPath(value, fallback) {
  const raw = (value || fallback).replace(/^file:/, "")
  return resolve(process.cwd(), raw)
}

const databasePath = dataPath(process.env.DATABASE_URL, "./data/muga-library.db")
const uploadsPath = dataPath(process.env.UPLOADS_DIR, "./data/uploads")
const backupRoot = resolve(process.cwd(), process.env.BACKUP_DIR || "./backups")
const stamp = new Date().toISOString().replace(/[:.]/g, "-")
const destination = join(backupRoot, stamp)
const destinationDatabase = join(destination, "muga-library.db")
const destinationUploads = join(destination, "uploads")

if (!existsSync(databasePath)) throw new Error(`Database not found: ${databasePath}`)
await mkdir(destination, { recursive: true })

const database = new Database(databasePath, { readonly: true })
try {
  await database.backup(destinationDatabase)
} finally {
  database.close()
}

if (existsSync(uploadsPath)) await cp(uploadsPath, destinationUploads, { recursive: true })
await writeFile(join(destination, "manifest.json"), JSON.stringify({
  createdAt: new Date().toISOString(),
  database: "muga-library.db",
  uploads: existsSync(uploadsPath),
}, null, 2))

console.log(`Backup created: ${destination}`)
