import { getRecordsByDatabase, createRecord, searchRecords, createRecordsBatch } from "@/lib/services/database"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { createRecordSchema, recordsQuerySchema, batchCreateRecordsSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const parsedQuery = recordsQuerySchema.safeParse({
    databaseId: searchParams.get("databaseId") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  })

  if (!parsedQuery.success) {
    return apiError(400, "VALIDATION_ERROR", parsedQuery.error.issues[0]?.message ?? "Invalid query params")
  }

  const { databaseId, q, limit, offset } = parsedQuery.data

  try {
    if (q) {
      const results = await searchRecords(q, databaseId)
      return apiSuccess(results)
    }

    if (!databaseId) {
      return apiError(400, "VALIDATION_ERROR", "databaseId is required when q is not provided")
    }

    const result = await getRecordsByDatabase(databaseId, { limit, offset })
    return apiSuccess(result)
  } catch (error) {
    console.error("Error fetching records:", error)
    return apiError(500, "RECORDS_FETCH_FAILED", "Failed to fetch records")
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, createRecordSchema)
  if (!parsed.success) return parsed.response

  try {
    const record = await createRecord({
      databaseId: parsed.data.database_id,
      data: parsed.data.data,
      totalEjemplares: parsed.data.total_ejemplares,
      disponibles: parsed.data.disponibles,
    })
    return apiSuccess(record, 201)
  } catch (error) {
    console.error("Error creating record:", error)
    return apiError(500, "RECORD_CREATE_FAILED", "Failed to create record")
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, batchCreateRecordsSchema)
  if (!parsed.success) return parsed.response

  try {
    const records = await createRecordsBatch(parsed.data.database_id, parsed.data.records)
    return apiSuccess({ created: records.length, records })
  } catch (error) {
    console.error("Error creating batch records:", error)
    return apiError(500, "BATCH_CREATE_FAILED", "Failed to create records")
  }
}
