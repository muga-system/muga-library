import { updateDatabase, deleteDatabase, getDatabaseById } from "@/lib/services/database"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { idParamSchema, updateDatabaseSchema } from "@/lib/api/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  try {
    const database = await getDatabaseById(parsedParams.data.id)
    if (!database) {
      return apiError(404, "DATABASE_NOT_FOUND", "Database not found")
    }
    return apiSuccess(database)
  } catch (error) {
    console.error("Error fetching database:", error)
    return apiError(500, "DATABASE_FETCH_FAILED", "Failed to fetch database")
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  const parsedBody = await parseJsonBody(request, updateDatabaseSchema)
  if (!parsedBody.success) return parsedBody.response

  try {
    const database = await updateDatabase(parsedParams.data.id, {
      name: parsedBody.data.name,
      description: parsedBody.data.description,
    })

    if (!database) {
      return apiError(404, "DATABASE_NOT_FOUND", "Database not found")
    }

    return apiSuccess(database)
  } catch (error) {
    console.error("Error updating database:", error)
    return apiError(500, "DATABASE_UPDATE_FAILED", "Failed to update database")
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
    const existing = await getDatabaseById(parsedParams.data.id)
    if (!existing) {
      return apiError(404, "DATABASE_NOT_FOUND", "Database not found")
    }

    await deleteDatabase(parsedParams.data.id)
    return apiSuccess({ success: true })
  } catch (error) {
    console.error("Error deleting database:", error)
    return apiError(500, "DATABASE_DELETE_FAILED", "Failed to delete database")
  }
}
