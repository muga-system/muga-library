import fs from "node:fs"
import Papa from "papaparse"

const baseUrl = process.env.MUGA_URL || "http://localhost:3000"
const csvPath = process.argv[2] || "data/import/aguapey/aguapey-completo.csv"
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const catalogName = process.env.MUGA_CATALOG_NAME || "Catálogo importado"

if (!email || !password) {
  throw new Error("ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios para importar datos")
}

function body(response) {
  return response.json()
}

const login = await fetch(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
})
if (!login.ok) throw new Error(`Login failed: ${login.status} ${await login.text()}`)
const cookie = login.headers.getSetCookie?.().join("; ") || login.headers.get("set-cookie") || ""
if (!cookie) throw new Error("Login succeeded without a session cookie")

const headers = { "content-type": "application/json", cookie }
const databasesResponse = await fetch(`${baseUrl}/api/databases`, { headers })
if (!databasesResponse.ok) throw new Error(`Database list failed: ${databasesResponse.status} ${await databasesResponse.text()}`)
const databasesPayload = await body(databasesResponse)
const databases = Array.isArray(databasesPayload) ? databasesPayload : (databasesPayload.data || [])
let database = databases.find((item) => item.name === catalogName)
if (!database) {
  const createResponse = await fetch(`${baseUrl}/api/databases`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: catalogName, description: "Migración completa desde Aguapey MARC.MST" }),
  })
  if (!createResponse.ok) throw new Error(`Catalog creation failed: ${createResponse.status} ${await createResponse.text()}`)
  const createdPayload = await body(createResponse)
  database = createdPayload.data || createdPayload
}

const csv = fs.readFileSync(csvPath, "utf8")
const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
if (parsed.errors.length) throw new Error(`CSV parse failed: ${JSON.stringify(parsed.errors.slice(0, 3))}`)
const records = parsed.data.map((row) => ({
  data: row,
  total_ejemplares: Number(row.total_ejemplares || 1),
  disponibles: Number(row.disponibles || 1),
}))

const existingResponse = await fetch(`${baseUrl}/api/records?databaseId=${database.id}&limit=1`, { headers })
if (!existingResponse.ok) throw new Error(`Existing records check failed: ${existingResponse.status} ${await existingResponse.text()}`)
const existing = await body(existingResponse)
const existingCount = existing.total ?? existing.data?.total ?? 0
if (existingCount > 0) {
  console.log(JSON.stringify({ databaseId: database.id, catalogName, imported: 0, existingCount, skipped: true }))
  process.exit(0)
}

let imported = 0
for (let start = 0; start < records.length; start += 1000) {
  const batch = records.slice(start, start + 1000)
  const response = await fetch(`${baseUrl}/api/records`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ database_id: database.id, records: batch }),
  })
  if (!response.ok) throw new Error(`Batch ${start}-${start + batch.length} failed: ${response.status} ${await response.text()}`)
  const result = await body(response)
  imported += result.created ?? result.data?.created ?? batch.length
  console.log(JSON.stringify({ batch: `${start + 1}-${start + batch.length}`, imported }))
}

console.log(JSON.stringify({ databaseId: database.id, catalogName, sourceRecords: records.length, imported }))
