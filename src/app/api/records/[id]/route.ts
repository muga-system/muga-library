import { getRecordById, updateRecord, deleteRecord } from "@/lib/services/database"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { idParamSchema, updateRecordSchema } from "@/lib/api/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  try {
    const record = await getRecordById(parsedParams.data.id)
    if (!record) {
      return apiError(404, "RECORD_NOT_FOUND", "Record not found")
    }
    return apiSuccess(record)
  } catch (error) {
    console.error("Error fetching record:", error)
    return apiError(500, "RECORD_FETCH_FAILED", "Failed to fetch record")
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  const parsedBody = await parseJsonBody(request, updateRecordSchema)
  if (!parsedBody.success) return parsedBody.response

  try {
    const existing = await getRecordById(parsedParams.data.id)
    if (!existing) {
      return apiError(404, "RECORD_NOT_FOUND", "Record not found")
    }

    const record = await updateRecord(parsedParams.data.id, {
      data: parsedBody.data.data,
      totalEjemplares: parsedBody.data.total_ejemplares,
      disponibles: parsedBody.data.disponibles,
    })
    return apiSuccess(record)
  } catch (error) {
    console.error("Error updating record:", error)
    return apiError(500, "RECORD_UPDATE_FAILED", "Failed to update record")
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  try {
    const existing = await getRecordById(parsedParams.data.id)
    if (!existing) {
      return apiError(404, "RECORD_NOT_FOUND", "Record not found")
    }

    await deleteRecord(parsedParams.data.id)
    return apiSuccess({ success: true })
  } catch (error) {
    console.error("Error deleting record:", error)
    return apiError(500, "RECORD_DELETE_FAILED", "Failed to delete record")
  }
}
