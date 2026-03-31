import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function getAllDatabases() {
  const { data, error } = await supabaseAdmin
    .from('databases')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAllDatabases error:', error)
    return []
  }
  return data || []
}

export async function getDatabaseById(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid) return null

  const { data, error } = await supabaseAdmin
    .from('databases')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  
  if (error) {
    console.error('getDatabaseById error:', error)
    return null
  }
  return data
}

export async function getDatabaseByName(name: string) {
  const { data, error } = await supabaseAdmin
    .from('databases')
    .select('*')
    .ilike('name', `%${name}%`)
    .limit(1)
  if (error || !data || data.length === 0) return null
  return data[0]
}

export async function getDatabaseBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('databases')
    .select('*')

  if (error || !data) return null

  return data.find((db) => slugify(db.name) === slug) ?? null
}

export async function createDatabase(data: { name: string; description?: string }) {
  const { data: result, error } = await supabaseAdmin
    .from('databases')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function updateDatabase(id: string, data: { name?: string; description?: string }) {
  const { data: result, error } = await supabaseAdmin
    .from('databases')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function deleteDatabase(id: string) {
  const { error } = await supabaseAdmin.from('databases').delete().eq('id', id)
  if (error) throw error
}

export async function getRecordsByDatabase(
  databaseId: string,
  options?: { limit?: number; offset?: number }
) {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  const [{ data, error, count }, countRes] = await Promise.all([
    supabaseAdmin
      .from('records')
      .select('*', { count: 'exact' })
      .eq('database_id', databaseId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabaseAdmin
      .from('records')
      .select('id', { count: 'exact', head: true })
      .eq('database_id', databaseId),
  ])

  if (error) {
    console.error('getRecordsByDatabase error:', error)
    return { records: [], total: 0 }
  }

  return { records: data || [], total: countRes.count || 0 }
}

export async function getRecordById(id: string) {
  const { data, error } = await supabaseAdmin.from('records').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function createRecord(data: {
  database_id?: string;
  databaseId?: string;
  data: Record<string, unknown>;
  total_ejemplares?: number;
  totalEjemplares?: number;
  disponibles?: number;
}) {
  const databaseId = data.database_id ?? data.databaseId
  const totalEjemplares = data.total_ejemplares ?? data.totalEjemplares
  const { data: result, error } = await supabaseAdmin.from('records').insert({
    database_id: databaseId,
    data: data.data,
    total_ejemplares: totalEjemplares || 1,
    disponibles: data.disponibles || 1,
  }).select().single()
  if (error) throw error
  return result
}

export async function createRecordsBatch(databaseId: string, records: Array<{
  data: Record<string, unknown>;
  total_ejemplares?: number;
  disponibles?: number;
}>) {
  const payload = records.map(r => ({
    database_id: databaseId,
    data: r.data,
    total_ejemplares: r.total_ejemplares || 1,
    disponibles: r.disponibles || 1,
  }))

  const { data, error } = await supabaseAdmin.from('records').insert(payload).select()
  if (error) throw error
  return data || []
}

export async function updateRecord(
  id: string,
  data: {
    data?: Record<string, unknown>;
    total_ejemplares?: number;
    totalEjemplares?: number;
    disponibles?: number;
  },
) {
  const { totalEjemplares, ...rest } = data
  const payload = {
    ...rest,
    total_ejemplares: data.total_ejemplares ?? totalEjemplares,
    updated_at: new Date().toISOString(),
  }

  const { data: result, error } = await supabaseAdmin.from('records').update(payload).eq('id', id).select().single()
  if (error) throw error
  return result
}

export async function deleteRecord(id: string) {
  const { error } = await supabaseAdmin.from('records').delete().eq('id', id)
  if (error) throw error
}

export async function searchRecords(query: string, databaseId?: string) {
  const term = query.trim().toLowerCase()

  const matchesInMemory = (records: any[]) => records.filter((record) => {
    const payload = typeof record.data === 'object' && record.data !== null
      ? (record.data as Record<string, unknown>)
      : {}

    const fields = [
      payload.title,
      payload.author,
      payload.isbn,
      payload.subject,
      payload.cdu,
      payload.publisher,
      payload.barcode,
      payload.year,
    ]

    if (fields.some((value) => String(value || '').toLowerCase().includes(term))) {
      return true
    }

    return JSON.stringify(payload).toLowerCase().includes(term)
  })

  const baseQuery = supabaseAdmin
    .from('records')
    .select('*')
    .order('created_at', { ascending: false })

  const scopedQuery = databaseId ? baseQuery.eq('database_id', databaseId) : baseQuery

  if (!term) {
    const { data, error } = await scopedQuery.limit(100)
    if (error) throw error
    return data || []
  }

  const escaped = term.replace(/[%]/g, "")
  const ilike = `%${escaped}%`

  const dbFiltered = await scopedQuery
    .or([
      `data->>title.ilike.${ilike}`,
      `data->>author.ilike.${ilike}`,
      `data->>isbn.ilike.${ilike}`,
      `data->>subject.ilike.${ilike}`,
      `data->>cdu.ilike.${ilike}`,
      `data->>publisher.ilike.${ilike}`,
      `data->>barcode.ilike.${ilike}`,
      `data->>year.ilike.${ilike}`,
    ].join(','))
    .limit(100)

  if (!dbFiltered.error) {
    return dbFiltered.data || []
  }

  const fallback = await scopedQuery.limit(400)
  if (fallback.error) throw fallback.error

  const matches = matchesInMemory(fallback.data || [])
  return matches.slice(0, 100)
}

export async function getAllLoans(status?: string) {
  let q = supabaseAdmin.from('loans').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error

  const loans = data || []
  const recordIds = [...new Set(loans.map((loan) => loan.record_id).filter(Boolean))]

  let recordsById = new Map<string, any>()
  if (recordIds.length > 0) {
    const recordsRes = await supabaseAdmin
      .from('records')
      .select('id,data')
      .in('id', recordIds as string[])

    if (!recordsRes.error) {
      recordsById = new Map((recordsRes.data || []).map((record) => [record.id, record]))
    }
  }

  return loans.map((loan) => {
    const record = recordsById.get(loan.record_id) || null
    return {
      ...loan,
      databaseId: loan.database_id,
      recordId: loan.record_id,
      borrowerType: loan.borrower_type,
      borrowerName: loan.borrower_name,
      borrowerCourse: loan.borrower_course,
      borrowerDivision: loan.borrower_division,
      borrowerDepartment: loan.borrower_department,
      loanDate: loan.loan_date,
      dueDate: loan.due_date,
      returnDate: loan.return_date,
      rejectionReason: loan.rejection_reason,
      approvedBy: loan.approved_by,
      approvedAt: loan.approved_at,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
      record,
      records: record,
    }
  })
}

export async function getLoanById(id: string) {
  const { data: loan, error } = await supabaseAdmin.from('loans').select('*').eq('id', id).single()
  if (error || !loan) return loan
  const { data: record } = await supabaseAdmin.from('records').select('*').eq('id', loan.record_id).single()
  return {
    ...loan,
    databaseId: loan.database_id,
    recordId: loan.record_id,
    borrowerType: loan.borrower_type,
    borrowerName: loan.borrower_name,
    borrowerCourse: loan.borrower_course,
    borrowerDivision: loan.borrower_division,
    borrowerDepartment: loan.borrower_department,
    loanDate: loan.loan_date,
    dueDate: loan.due_date,
    returnDate: loan.return_date,
    rejectionReason: loan.rejection_reason,
    approvedBy: loan.approved_by,
    approvedAt: loan.approved_at,
    createdAt: loan.created_at,
    updatedAt: loan.updated_at,
    record,
    records: record,
  }
}

export async function createLoan(data: {
  database_id?: string;
  databaseId?: string;
  record_id?: string;
  recordId?: string;
  borrower_type?: string;
  borrowerType?: string;
  borrower_name?: string;
  borrowerName?: string;
  borrower_course?: string;
  borrowerCourse?: string;
  borrower_division?: string;
  borrowerDivision?: string;
  borrower_department?: string;
  borrowerDepartment?: string;
  notes?: string;
  created_by?: string;
  createdBy?: string;
  public_request?: boolean;
  publicRequest?: boolean;
}) {
  const databaseId = data.database_id ?? data.databaseId
  const recordId = data.record_id ?? data.recordId
  const borrowerType = data.borrower_type ?? data.borrowerType
  const borrowerName = data.borrower_name ?? data.borrowerName
  const borrowerCourse = data.borrower_course ?? data.borrowerCourse
  const borrowerDivision = data.borrower_division ?? data.borrowerDivision
  const borrowerDepartment = data.borrower_department ?? data.borrowerDepartment
  const createdBy = data.created_by ?? data.createdBy
  const publicRequest = data.public_request ?? data.publicRequest

  if (publicRequest && createdBy && recordId) {
    const existing = await supabaseAdmin
      .from('loans')
      .select('id')
      .eq('record_id', recordId)
      .eq('created_by', createdBy)
      .in('status', ['requested', 'active'])
      .limit(1)

    if (!existing.error && (existing.data || []).length > 0) {
      throw new Error('DUPLICATE_ACTIVE_LOAN')
    }
  }

  const configRes = await supabaseAdmin.from('loan_config').select('key, value')
  const config = (configRes.data || []).reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>)
  const loanDays = parseInt(config.loan_days || '7')
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + loanDays)
  const { data: loan, error } = await supabaseAdmin.from('loans').insert({
    database_id: databaseId,
    record_id: recordId,
    borrower_type: borrowerType,
    borrower_name: borrowerName,
    borrower_course: borrowerCourse,
    borrower_division: borrowerDivision,
    borrower_department: borrowerDepartment,
    loan_date: new Date().toISOString().split('T')[0],
    due_date: dueDate.toISOString().split('T')[0],
    status: publicRequest ? 'requested' : 'active',
    notes: data.notes,
    created_by: createdBy,
  }).select().single()
  if (error) throw error
  const record = await getRecordById(recordId || '')
  if (!publicRequest && record && recordId) {
    await supabaseAdmin
      .from('records')
      .update({ disponibles: Math.max(0, (record.disponibles || 1) - 1) })
      .eq('id', recordId)
  }
  return loan
}

export async function approveLoan(id: string, approvedBy: string) {
  const loan = await getLoanById(id)
  if (!loan) return null

  if (loan.status === 'active') {
    return loan
  }

  if (loan.status !== 'requested') {
    throw new Error('INVALID_LOAN_STATE')
  }

  const record = await getRecordById(loan.record_id)
  if (!record || (record.disponibles || 0) <= 0) {
    throw new Error('NO_AVAILABLE_COPIES')
  }

  const { data, error } = await supabaseAdmin
    .from('loans')
    .update({
      status: 'active',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function rejectLoan(id: string, reason?: string) {
  const loan = await getLoanById(id)
  if (!loan) return null

  if (loan.status === 'rejected') {
    return loan
  }

  if (loan.status !== 'requested') {
    throw new Error('INVALID_LOAN_STATE')
  }

  const { data, error } = await supabaseAdmin
    .from('loans')
    .update({
      status: 'rejected',
      rejection_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function returnLoan(id: string) {
  const loan = await getLoanById(id)
  if (!loan) return null
  const { data: result, error } = await supabaseAdmin.from('loans').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] }).eq('id', id).select().single()
  if (error) throw error
  return result
}

export async function getLoanStats() {
  const today = new Date().toISOString().split('T')[0]
  const [requestedRes, activeRes, overdueByStatusRes, overdueByDateRes, returnedRes] = await Promise.all([
    supabaseAdmin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    supabaseAdmin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
    supabaseAdmin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active').lt('due_date', today),
    supabaseAdmin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'returned'),
  ])

  return {
    requested: requestedRes.count || 0,
    active: activeRes.count || 0,
    overdue: (overdueByStatusRes.count || 0) + (overdueByDateRes.count || 0),
    returned: returnedRes.count || 0,
  }
}

export async function getLoanConfig() {
  const { data, error } = await supabaseAdmin.from('loan_config').select('*')
  if (error) throw error
  return data || []
}

export async function updateLoanConfig(key: string, value: string) {
  const { data, error } = await supabaseAdmin.from('loan_config').update({ value, updated_at: new Date().toISOString() }).eq('key', key).select().single()
  if (error) throw error
  return data
}

export async function upsertLoanConfigEntries(entries: Record<string, string>) {
  const payload = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabaseAdmin
    .from('loan_config')
    .upsert(payload, { onConflict: 'key' })

  if (error) throw error
}

export async function getCduClasses() {
  const { data, error } = await supabaseAdmin.from('cdu_classes').select('*').order('code')
  if (error) throw error
  return data || []
}

export type PublicBook = {
  id: string
  databaseId: string
  databaseName: string
  title: string
  author: string
  year: string
  isbn: string
  subject: string
  description: string
  coverUrl: string
  disponibles: number
  totalEjemplares: number
}

export type PublicBooksResult = {
  items: PublicBook[]
  total: number
  page: number
  pageSize: number
}

function pickBookPayload(data: unknown): Record<string, unknown> {
  if (typeof data === 'object' && data !== null) return data as Record<string, unknown>
  return {}
}

function normalizeIsbn(value: unknown): string {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase()
}

function getPublicCoverResolverUrl(args: { title: string; author: string; isbn: string }): string {
  const params = new URLSearchParams()
  if (args.title) params.set('title', args.title)
  if (args.author) params.set('author', args.author)
  if (args.isbn) params.set('isbn', args.isbn)
  return `/api/public/book-cover?${params.toString()}`
}

export async function getPublicBooks(options?: {
  search?: string
  databaseId?: string
  page?: number
  pageSize?: number
}): Promise<PublicBooksResult> {
  const search = options?.search?.trim() || ""
  const databaseId = options?.databaseId?.trim() || ""
  const page = Math.max(1, options?.page || 1)
  const pageSize = Math.max(1, Math.min(options?.pageSize || 20, 60))
  const offset = (page - 1) * pageSize

  let queryBuilder = supabaseAdmin
    .from('records')
    .select('id,database_id,data,disponibles,total_ejemplares,created_at,databases(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (databaseId) {
    queryBuilder = queryBuilder.eq('database_id', databaseId)
  }

  const term = search.toLowerCase()
  if (term) {
    const escaped = term.replace(/[%]/g, "")
    const ilike = `%${escaped}%`
    queryBuilder = queryBuilder.or([
      `data->>title.ilike.${ilike}`,
      `data->>author.ilike.${ilike}`,
      `data->>isbn.ilike.${ilike}`,
      `data->>subject.ilike.${ilike}`,
    ].join(','))
  }

  const paged = await queryBuilder.range(offset, offset + pageSize - 1)

  if (!paged.error) {
    const rows = paged.data || []
    const items = rows.map((row: any) => {
      const payload = pickBookPayload(row.data)
      const isbn = normalizeIsbn(payload.isbn)
      const title = String(payload.title || 'Sin titulo')
      const author = String(payload.author || '')
      const customCover = String(payload.cover_url || '').trim()
      const dbName = Array.isArray(row.databases)
        ? row.databases[0]?.name
        : row.databases?.name

      return {
        id: row.id,
        databaseId: row.database_id,
        databaseName: String(dbName || 'Catalogo'),
        title,
        author,
        year: String(payload.year || ''),
        isbn,
        subject: String(payload.subject || ''),
        description: String(payload.description || ''),
        coverUrl: customCover || getPublicCoverResolverUrl({ title, author, isbn }),
        disponibles: Number(row.disponibles || 0),
        totalEjemplares: Number(row.total_ejemplares || 0),
      }
    })

    return {
      items,
      total: Number(paged.count || 0),
      page,
      pageSize,
    }
  }

  const fallbackRows = await supabaseAdmin
    .from('records')
    .select('id,database_id,data,disponibles,total_ejemplares,created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (fallbackRows.error) throw fallbackRows.error

  const records = fallbackRows.data || []
  const databaseIds = [...new Set(records.map((row) => row.database_id).filter(Boolean))]

  let databaseMap = new Map<string, string>()
  if (databaseIds.length > 0) {
    const dbRes = await supabaseAdmin.from('databases').select('id,name').in('id', databaseIds as string[])
    if (!dbRes.error && dbRes.data) {
      databaseMap = new Map(dbRes.data.map((row) => [row.id, row.name]))
    }
  }

  const mapped = records.map((row) => {
    const payload = pickBookPayload(row.data)
    const isbn = normalizeIsbn(payload.isbn)
    const title = String(payload.title || 'Sin titulo')
    const author = String(payload.author || '')
    const customCover = String(payload.cover_url || '').trim()
    return {
      id: row.id,
      databaseId: row.database_id,
      databaseName: databaseMap.get(row.database_id) || 'Catalogo',
      title,
      author,
      year: String(payload.year || ''),
      isbn,
      subject: String(payload.subject || ''),
      description: String(payload.description || ''),
      coverUrl: customCover || getPublicCoverResolverUrl({ title, author, isbn }),
      disponibles: Number(row.disponibles || 0),
      totalEjemplares: Number(row.total_ejemplares || 0),
    }
  })

  const filteredByCatalog = databaseId
    ? mapped.filter((book) => book.databaseId === databaseId)
    : mapped

  const filtered = !term
    ? filteredByCatalog
    : filteredByCatalog.filter((book) => {
        return (
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          book.isbn.toLowerCase().includes(term) ||
          book.subject.toLowerCase().includes(term) ||
          book.databaseName.toLowerCase().includes(term)
        )
      })

  return {
    items: filtered.slice(offset, offset + pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}

export async function getPublicCatalogs(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabaseAdmin
    .from('databases')
    .select('id,name')
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []).map((row) => ({ id: row.id, name: row.name }))
}

export async function getPublicBookById(id: string): Promise<PublicBook | null> {
  const { data: row, error } = await supabaseAdmin
    .from('records')
    .select('id,database_id,data,disponibles,total_ejemplares')
    .eq('id', id)
    .maybeSingle()

  if (error || !row) return null

  const dbRes = await supabaseAdmin.from('databases').select('name').eq('id', row.database_id).maybeSingle()
  const payload = pickBookPayload(row.data)
  const isbn = normalizeIsbn(payload.isbn)
  const title = String(payload.title || 'Sin titulo')
  const author = String(payload.author || '')
  const customCover = String(payload.cover_url || '').trim()

  return {
    id: row.id,
    databaseId: row.database_id,
    databaseName: dbRes.data?.name || 'Catalogo',
    title,
    author,
    year: String(payload.year || ''),
    isbn,
    subject: String(payload.subject || ''),
    description: String(payload.description || ''),
    coverUrl: customCover || getPublicCoverResolverUrl({ title, author, isbn }),
    disponibles: Number(row.disponibles || 0),
    totalEjemplares: Number(row.total_ejemplares || 0),
  }
}

export async function hasActiveLoanForUser(recordId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('loans')
    .select('id')
    .eq('record_id', recordId)
    .eq('created_by', userId)
    .eq('status', 'active')
    .limit(1)

  if (error) return false

  return (data || []).length > 0
}

export async function getActiveLoanRecordIdsForUser(userId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('loans')
    .select('record_id')
    .eq('created_by', userId)
    .eq('status', 'active')

  if (error) return new Set()

  return new Set((data || []).map((row) => row.record_id).filter(Boolean))
}

export async function getMyLoanStatusForRecord(recordId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('loans')
    .select('id,status,loan_date,due_date,return_date,rejection_reason,created_at')
    .eq('record_id', recordId)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data || null
}

export async function getMyLoans(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('loans')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const loans = data || []
  const recordIds = [...new Set(loans.map((loan) => loan.record_id).filter(Boolean))]

  let recordsById = new Map<string, any>()
  if (recordIds.length > 0) {
    const recordsRes = await supabaseAdmin
      .from('records')
      .select('id,data')
      .in('id', recordIds as string[])

    if (!recordsRes.error) {
      recordsById = new Map((recordsRes.data || []).map((record) => [record.id, record]))
    }
  }

  return loans.map((loan) => ({
    ...loan,
    databaseId: loan.database_id,
    recordId: loan.record_id,
    borrowerType: loan.borrower_type,
    borrowerName: loan.borrower_name,
    loanDate: loan.loan_date,
    dueDate: loan.due_date,
    returnDate: loan.return_date,
    rejectionReason: loan.rejection_reason,
    createdAt: loan.created_at,
    updatedAt: loan.updated_at,
    record: recordsById.get(loan.record_id) || null,
  }))
}
