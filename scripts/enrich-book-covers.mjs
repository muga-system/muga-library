import Database from "better-sqlite3"
import sharp from "sharp"
import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"

const args = process.argv.slice(2)
const limitArg = args[args.indexOf("--limit") + 1]
const limit = Math.max(1, Number.parseInt(limitArg || "24", 10) || 24)
const databasePath = resolve(process.cwd(), "data/muga-library.db")
const outputDirectory = resolve(process.cwd(), "data/uploads/book-covers/catalog")
const publicPrefix = "/api/uploads/book-covers/catalog"

const sqlite = new Database(databasePath)
const rows = sqlite.prepare("SELECT id, data FROM records WHERE json_extract(data, '$.cover_url') IS NULL OR json_extract(data, '$.cover_url') = '' ORDER BY created_at ASC LIMIT ?").all(limit)
const update = sqlite.prepare("UPDATE records SET data = json_set(data, '$.cover_url', ?), updated_at = ? WHERE id = ?")

function text(value) {
  return String(value || "").trim()
}

function meaningfulTitle(title) {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2)
}

function queryFor(row) {
  const data = JSON.parse(row.data)
  return { title: text(data.title), author: text(data.author), isbn: text(data.isbn) }
}

async function openLibraryCover({ title, author, isbn }) {
  const query = isbn ? `isbn:${encodeURIComponent(isbn)}` : encodeURIComponent([title, author].filter(Boolean).join(" "))
  if (!query) return null
  const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=5`, { headers: { accept: "application/json", "user-agent": "MUGA-Library-Cover-Enricher/1.0" } })
  if (!response.ok) return null
  const payload = await response.json()
  const document = payload.docs?.find((item) => item.cover_i)
  return document?.cover_i ? `https://covers.openlibrary.org/b/id/${document.cover_i}-L.jpg` : null
}

async function googleBooksCover({ title, author, isbn }) {
  const query = isbn ? `isbn:${isbn}` : [title, author].filter(Boolean).join(" ")
  if (!query) return null
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`, { headers: { accept: "application/json", "user-agent": "MUGA-Library-Cover-Enricher/1.0" } })
  if (!response.ok) return null
  const payload = await response.json()
  const image = payload.items?.map((item) => item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail).find(Boolean)
  return image ? String(image).replace(/^http:/, "https:").replace(/zoom=\d+/, "zoom=2") : null
}

async function downloadCover(book) {
  if (!book.isbn && meaningfulTitle(book.title).length < 2) return null
  for (const resolver of [openLibraryCover, googleBooksCover]) {
    try {
      const sourceUrl = await resolver(book)
      if (!sourceUrl) continue
      const response = await fetch(sourceUrl, { headers: { accept: "image/avif,image/webp,image/jpeg,image/*", "user-agent": "MUGA-Library-Cover-Enricher/1.0" } })
      if (!response.ok) continue
      const input = Buffer.from(await response.arrayBuffer())
      const output = await sharp(input).rotate().resize({ width: 480, height: 720, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer()
      return output
    } catch {
      // Continue with the next provider when a book has no usable image.
    }
  }
  return null
}

await mkdir(outputDirectory, { recursive: true })
let downloaded = 0
for (const row of rows) {
  const book = queryFor(row)
  const image = await downloadCover(book)
  if (!image) {
    console.log(`SIN PORTADA | ${book.title}`)
    continue
  }
  const filename = `${row.id}.webp`
  await writeFile(join(outputDirectory, filename), image)
  update.run(`${publicPrefix}/${filename}`, new Date().toISOString(), row.id)
  downloaded += 1
  console.log(`OK | ${book.title} | ${(image.length / 1024).toFixed(1)} KB`)
}

sqlite.close()
console.log(`Resultado: ${downloaded}/${rows.length} portadas descargadas y optimizadas en WebP.`)
