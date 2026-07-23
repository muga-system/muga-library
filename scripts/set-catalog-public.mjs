import Database from "better-sqlite3"

const sqlite = new Database("data/muga-library.db")
const result = sqlite.prepare("UPDATE databases SET is_public = 1, library_visibility = 'public', updated_at = ? WHERE name = ?").run(new Date().toISOString(), "Aguapey - Migración completa")
console.log(JSON.stringify({ updated: result.changes }))
sqlite.close()
