import { getAllDatabases, createDatabase } from "@/lib/services/database"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { requireApiAdmin } from "@/lib/api/auth"
import { createDatabaseSchema } from "@/lib/api/schemas"

export async function GET() {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  try {
    const databases = await getAllDatabases()
    return apiSuccess(databases)
  } catch (error) {
    console.error("Error fetching databases:", error)
    return apiError(500, "DATABASES_FETCH_FAILED", "Failed to fetch databases")
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, createDatabaseSchema)
  if (!parsed.success) return parsed.response

  try {
    const database = await createDatabase({
      name: parsed.data.name,
      description: parsed.data.description,
    })
    return apiSuccess(database, 201)
  } catch (error) {
    console.error("Error creating database:", error)
    return apiError(500, "DATABASE_CREATE_FAILED", "Failed to create database")
  }
}
