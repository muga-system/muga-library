import { cp, mkdir, copyFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"

function dataPath(value, fallback) {
  const raw = (value || fallback).replace(/^file:/, "")
  return resolve(process.cwd(), raw)
}

const [requestedBackup, ...flags] = process.argv.slice(2)
if (!requestedBackup || !flags.includes("--force")) {
  console.error("Usage: pnpm db:restore <backup-directory> --force")
  process.exit(1)
}

const backupDirectory = resolve(process.cwd(), requestedBackup)
const backupDatabase = join(backupDirectory, "muga-library.db")
const backupUploads = join(backupDirectory, "uploads")
const databasePath = dataPath(process.env.DATABASE_URL, "./data/muga-library.db")
const uploadsPath = dataPath(process.env.UPLOADS_DIR, "./data/uploads")

if (!existsSync(backupDatabase)) throw new Error(`Backup database not found: ${backupDatabase}`)
await mkdir(resolve(databasePath, ".."), { recursive: true })
await copyFile(backupDatabase, databasePath)
if (existsSync(backupUploads)) await cp(backupUploads, uploadsPath, { recursive: true, force: true })

console.log(`Restore completed from: ${backupDirectory}`)
