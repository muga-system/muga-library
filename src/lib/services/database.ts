import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { cduClasses, databases, loanConfig, loans, records } from "@/lib/db/schema"

type RecordData = Record<string, unknown>
const now = () => new Date().toISOString()

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function databaseRow(row: typeof databases.$inferSelect) {
  return { ...row, database_id: row.id, owner_id: row.ownerId, is_public: row.isPublic, catalog_type: row.catalogType, library_visibility: row.libraryVisibility, created_at: row.createdAt, updated_at: row.updatedAt }
}

function recordRow(row: typeof records.$inferSelect) {
  return { ...row, mfn: row.mfn ?? 0, database_id: row.databaseId, total_ejemplares: row.totalEjemplares, disponibles: row.disponibles, created_at: row.createdAt, updated_at: row.updatedAt }
}

function loanRow(row: typeof loans.$inferSelect, record?: ReturnType<typeof recordRow> | null) {
  return { ...row, database_id: row.databaseId, record_id: row.recordId, rejection_reason: row.rejectionReason, approved_by: row.approvedBy, approved_at: row.approvedAt, created_at: row.createdAt, updated_at: row.updatedAt, databaseId: row.databaseId, recordId: row.recordId, borrowerType: row.borrowerType, borrowerName: row.borrowerName, borrowerCourse: row.borrowerCourse, borrowerDivision: row.borrowerDivision, borrowerDepartment: row.borrowerDepartment, loanDate: row.loanDate, dueDate: row.dueDate, returnDate: row.returnDate, rejectionReason: row.rejectionReason, approvedBy: row.approvedBy, approvedAt: row.approvedAt, createdAt: row.createdAt, updatedAt: row.updatedAt, record: record || null, records: record || null }
}

export async function getAllDatabases() { return db.select().from(databases).orderBy(desc(databases.createdAt)).all().map(databaseRow) }
export async function getAllRecords() { return db.select().from(records).orderBy(desc(records.createdAt)).all().map(recordRow) }
export async function getDatabaseById(id: string) { const row = db.select().from(databases).where(eq(databases.id, id)).get(); return row ? databaseRow(row) : null }
export async function getDatabaseByName(name: string) { const row = db.select().from(databases).where(eq(databases.name, name)).get(); return row ? databaseRow(row) : null }
export async function getDatabaseBySlug(slug: string) { const row = db.select().from(databases).all().find((item) => slugify(item.name) === slug); return row ? databaseRow(row) : null }

export async function createDatabase(data: { name: string; description?: string; ownerId?: string }) {
  const timestamp = now()
  const [row] = db.insert(databases).values({ name: data.name, description: data.description || null, ownerId: data.ownerId, createdAt: timestamp, updatedAt: timestamp }).returning().all()
  return databaseRow(row)
}

export async function updateDatabase(id: string, data: { name?: string; description?: string }) {
  const [row] = db.update(databases).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(databases.id, id)).returning().all()
  return databaseRow(row)
}

export async function deleteDatabase(id: string) { db.delete(databases).where(eq(databases.id, id)).run() }

export async function getRecordsByDatabase(databaseId: string, options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0
  const rows = db.select().from(records).where(eq(records.databaseId, databaseId)).orderBy(desc(records.createdAt)).limit(limit).offset(offset).all()
  const total = db.select({ count: sql<number>`count(*)` }).from(records).where(eq(records.databaseId, databaseId)).get()?.count || 0
  return { records: rows.map(recordRow), total }
}

export async function getRecordById(id: string) { const row = db.select().from(records).where(eq(records.id, id)).get(); return row ? recordRow(row) : null }

export async function createRecord(data: { database_id?: string; databaseId?: string; data: RecordData; total_ejemplares?: number; totalEjemplares?: number; disponibles?: number }) {
  const timestamp = now()
  const [row] = db.insert(records).values({ databaseId: data.database_id ?? data.databaseId!, data: data.data, totalEjemplares: data.total_ejemplares ?? data.totalEjemplares ?? 1, disponibles: data.disponibles ?? 1, createdAt: timestamp, updatedAt: timestamp }).returning().all()
  return recordRow(row)
}

export async function createRecordsBatch(databaseId: string, values: Array<{ data: RecordData; total_ejemplares?: number; disponibles?: number }>) {
  if (!values.length) return []
  const timestamp = now()
  const rows = db.insert(records).values(values.map((item) => ({ databaseId, data: item.data, totalEjemplares: item.total_ejemplares ?? 1, disponibles: item.disponibles ?? 1, createdAt: timestamp, updatedAt: timestamp }))).returning().all()
  return rows.map(recordRow)
}

export async function updateRecord(id: string, data: { data?: RecordData; total_ejemplares?: number; totalEjemplares?: number; disponibles?: number }) {
  const [row] = db.update(records).set({ data: data.data, totalEjemplares: data.total_ejemplares ?? data.totalEjemplares, disponibles: data.disponibles, updatedAt: new Date().toISOString() }).where(eq(records.id, id)).returning().all()
  return recordRow(row)
}

export async function deleteRecord(id: string) { db.delete(records).where(eq(records.id, id)).run() }

function matchingRecordRows(query: string, databaseId?: string) {
  const term = query.trim().toLowerCase()
  const rows = db.select().from(records).where(databaseId ? eq(records.databaseId, databaseId) : undefined).orderBy(desc(records.createdAt)).all()
  return term ? rows.filter((row) => JSON.stringify(row.data).toLowerCase().includes(term)) : rows
}

export async function searchRecords(query: string, databaseId?: string, options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0
  return matchingRecordRows(query, databaseId).slice(offset, offset + limit).map(recordRow)
}

export async function countSearchRecords(query: string, databaseId?: string) {
  return matchingRecordRows(query, databaseId).length
}

export async function getAllLoans(status?: string) {
  const rows = db.select().from(loans).where(status ? eq(loans.status, status) : undefined).orderBy(desc(loans.createdAt)).all()
  const recordIds = [...new Set(rows.map((row) => row.recordId))]
  const recordRows = recordIds.length ? db.select().from(records).where(inArray(records.id, recordIds)).all() : []
  const byId = new Map(recordRows.map((row) => [row.id, recordRow(row)]))
  return rows.map((row) => loanRow(row, byId.get(row.recordId)))
}

export async function getLoanById(id: string) {
  const row = db.select().from(loans).where(eq(loans.id, id)).get()
  if (!row) return null
  const record = await getRecordById(row.recordId)
  return loanRow(row, record)
}

export async function createLoan(data: { database_id?: string; databaseId?: string; record_id?: string; recordId?: string; borrower_type?: string; borrowerType?: string; borrower_name?: string; borrowerName?: string; borrower_course?: string; borrowerCourse?: string; borrower_division?: string; borrowerDivision?: string; borrower_department?: string; borrowerDepartment?: string; notes?: string; created_by?: string; createdBy?: string; public_request?: boolean; publicRequest?: boolean }) {
  const databaseId = data.database_id ?? data.databaseId!
  const recordId = data.record_id ?? data.recordId!
  const publicRequest = data.public_request ?? data.publicRequest ?? false
  const createdBy = data.created_by ?? data.createdBy
  const record = db.select().from(records).where(and(eq(records.id, recordId), eq(records.databaseId, databaseId))).get()
  if (!record) throw new Error("RECORD_NOT_FOUND")
  if (publicRequest && record.disponibles <= 0) throw new Error("NO_AVAILABLE_COPIES")
  if (createdBy) {
    const existing = db.select().from(loans).where(and(eq(loans.recordId, recordId), eq(loans.createdBy, createdBy), inArray(loans.status, ["requested", "active", "overdue"]))).get()
    if (existing) throw new Error("DUPLICATE_ACTIVE_LOAN")
  }
  const config = db.select().from(loanConfig).where(eq(loanConfig.key, "loan_days")).get()
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + Number(config?.value || 7))
  const timestamp = now()
  const [row] = db.insert(loans).values({ databaseId, recordId, borrowerType: data.borrower_type ?? data.borrowerType!, borrowerName: data.borrower_name ?? data.borrowerName!, borrowerCourse: data.borrower_course ?? data.borrowerCourse, borrowerDivision: data.borrower_division ?? data.borrowerDivision, borrowerDepartment: data.borrower_department ?? data.borrowerDepartment, loanDate: new Date().toISOString().slice(0, 10), dueDate: dueDate.toISOString().slice(0, 10), status: publicRequest ? "requested" : "active", notes: data.notes, createdBy, createdAt: timestamp, updatedAt: timestamp }).returning().all()
  if (!publicRequest) db.update(records).set({ disponibles: sql`max(0, ${records.disponibles} - 1)` }).where(eq(records.id, recordId)).run()
  return loanRow(row)
}

export async function approveLoan(id: string, approvedBy: string) {
  const loan = db.select().from(loans).where(eq(loans.id, id)).get(); if (!loan) return null
  if (loan.status === "active") return loanRow(loan)
  if (loan.status !== "requested") throw new Error("INVALID_LOAN_STATE")
  const reservedCopy = db.update(records).set({ disponibles: sql`${records.disponibles} - 1` }).where(and(eq(records.id, loan.recordId), gt(records.disponibles, 0))).returning({ id: records.id }).get()
  if (!reservedCopy) throw new Error("NO_AVAILABLE_COPIES")
  const approvalDate = new Date()
  const config = db.select().from(loanConfig).where(eq(loanConfig.key, "loan_days")).get()
  const dueDate = new Date(approvalDate)
  dueDate.setDate(dueDate.getDate() + Number(config?.value || 7))
  const [row] = db.update(loans).set({ status: "active", loanDate: approvalDate.toISOString().slice(0, 10), dueDate: dueDate.toISOString().slice(0, 10), approvedBy, approvedAt: approvalDate.toISOString(), updatedAt: approvalDate.toISOString() }).where(eq(loans.id, id)).returning().all()
  return loanRow(row)
}

export async function rejectLoan(id: string, reason?: string) { const [row] = db.update(loans).set({ status: "rejected", rejectionReason: reason || null, updatedAt: new Date().toISOString() }).where(eq(loans.id, id)).returning().all(); return row ? loanRow(row) : null }
export async function returnLoan(id: string) { const loan = db.select().from(loans).where(eq(loans.id, id)).get(); if (!loan) return null; const [row] = db.update(loans).set({ status: "returned", returnDate: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString() }).where(eq(loans.id, id)).returning().all(); if (["active", "overdue"].includes(loan.status)) db.update(records).set({ disponibles: sql`${records.disponibles} + 1` }).where(eq(records.id, loan.recordId)).run(); return loanRow(row) }

export async function getLoanStats() {
  const rows = db.select().from(loans).all(); const today = new Date().toISOString().slice(0, 10)
  return { requested: rows.filter((row) => row.status === "requested").length, active: rows.filter((row) => row.status === "active").length, overdue: rows.filter((row) => row.status === "overdue" || (row.status === "active" && row.dueDate < today)).length, returned: rows.filter((row) => row.status === "returned").length }
}
export async function getLoanConfig() { return db.select().from(loanConfig).all() }
export async function updateLoanConfig(key: string, value: string) { const [row] = db.update(loanConfig).set({ value, updatedAt: new Date().toISOString() }).where(eq(loanConfig.key, key)).returning().all(); return row }
export async function upsertLoanConfigEntries(entries: Record<string, string>) { for (const [key, value] of Object.entries(entries)) db.insert(loanConfig).values({ key, value }).onConflictDoUpdate({ target: loanConfig.key, set: { value, updatedAt: new Date().toISOString() } }).run() }
export async function getCduClasses() { return db.select().from(cduClasses).orderBy(cduClasses.code).all() }

export type PublicBook = { id: string; databaseId: string; databaseName: string; title: string; author: string; year: string; isbn: string; subject: string; description: string; coverUrl: string; disponibles: number; totalEjemplares: number }
export type PublicBooksResult = { items: PublicBook[]; total: number; page: number; pageSize: number }
export type PublicCatalog = { id: string; name: string; description: string; catalogType: string; totalBooks: number }

function publicBook(row: ReturnType<typeof recordRow>, databaseName: string): PublicBook {
  const data = row.data as RecordData
  return { id: row.id, databaseId: row.database_id, databaseName, title: String(data.title || "Sin titulo"), author: String(data.author || ""), year: String(data.year || ""), isbn: String(data.isbn || ""), subject: String(data.subject || ""), description: String(data.description || ""), coverUrl: String(data.cover_url || ""), disponibles: row.disponibles || 0, totalEjemplares: row.total_ejemplares || 0 }
}

export async function getPublicBooks(options?: { search?: string; databaseId?: string; page?: number; pageSize?: number }): Promise<PublicBooksResult> {
  const page = Math.max(1, options?.page || 1); const pageSize = Math.min(60, Math.max(1, options?.pageSize || 20)); const term = (options?.search || "").toLowerCase()
  const dbRows = db.select().from(databases).all(); const names = new Map(dbRows.map((row) => [row.id, row.name]))
  const publicDatabaseIds = new Set(dbRows.filter((row) => row.isPublic).map((row) => row.id))
  const rows = db.select().from(records).all().filter((row) => publicDatabaseIds.has(row.databaseId)).filter((row) => !options?.databaseId || row.databaseId === options.databaseId).filter((row) => !term || JSON.stringify(row.data).toLowerCase().includes(term))
  const sortedRows = rows.sort((a, b) => {
    const aHasCover = Boolean((a.data as RecordData).cover_url)
    const bHasCover = Boolean((b.data as RecordData).cover_url)
    return Number(bHasCover) - Number(aHasCover)
  })
  return { items: sortedRows.slice((page - 1) * pageSize, page * pageSize).map((row) => publicBook(recordRow(row), names.get(row.databaseId) || "")), total: sortedRows.length, page, pageSize }
}
export async function getPublicCatalogs(): Promise<PublicCatalog[]> {
  const catalogRows = db.select({ id: databases.id, name: databases.name, description: databases.description, catalogType: databases.catalogType }).from(databases).where(eq(databases.isPublic, true)).all()
  const counts = new Map<string, number>()
  for (const row of db.select({ databaseId: records.databaseId }).from(records).all()) {
    counts.set(row.databaseId, (counts.get(row.databaseId) || 0) + 1)
  }
  return catalogRows.map((catalog) => ({ ...catalog, description: catalog.description || "", totalBooks: counts.get(catalog.id) || 0 }))
}
export async function getPublicBookById(id: string) { const row = db.select().from(records).where(eq(records.id, id)).get(); if (!row) return null; const catalog = db.select().from(databases).where(eq(databases.id, row.databaseId)).get(); if (!catalog?.isPublic) return null; return publicBook(recordRow(row), catalog.name) }
export async function hasActiveLoanForUser(recordId: string, userId: string) { return Boolean(db.select().from(loans).where(and(eq(loans.recordId, recordId), eq(loans.createdBy, userId), inArray(loans.status, ["requested", "active"]))).get()) }
export async function getActiveLoanRecordIdsForUser(userId: string) { return new Set(db.select({ recordId: loans.recordId }).from(loans).where(and(eq(loans.createdBy, userId), inArray(loans.status, ["requested", "active"]))).all().map((row) => row.recordId)) }
export async function getMyLoanStatusForRecord(recordId: string, userId: string) { const row = db.select().from(loans).where(and(eq(loans.recordId, recordId), eq(loans.createdBy, userId))).orderBy(desc(loans.createdAt)).get(); return row ? loanRow(row) : null }
export async function getMyLoans(userId: string) {
  const loanRows = db.select().from(loans).where(eq(loans.createdBy, userId)).orderBy(desc(loans.createdAt)).all()
  const recordIds = [...new Set(loanRows.map((row) => row.recordId))]
  const recordRows = recordIds.length ? db.select().from(records).where(inArray(records.id, recordIds)).all() : []
  const recordsById = new Map(recordRows.map((row) => [row.id, recordRow(row)]))
  const databaseIds = [...new Set(loanRows.map((row) => row.databaseId))]
  const databaseRows = databaseIds.length ? db.select({ id: databases.id, name: databases.name }).from(databases).where(inArray(databases.id, databaseIds)).all() : []
  const databaseNames = new Map(databaseRows.map((row) => [row.id, row.name]))
  return loanRows.map((row) => ({ ...loanRow(row, recordsById.get(row.recordId)), databaseName: databaseNames.get(row.databaseId) || "Biblioteca" }))
}
