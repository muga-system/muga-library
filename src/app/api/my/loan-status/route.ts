import { getMyLoanStatusForRecord } from "@/lib/services/database"
import { requireApiUser } from "@/lib/api/auth"
import { apiError, apiSuccess } from "@/lib/api/http"

export async function GET(request: Request) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const recordId = (searchParams.get("recordId") || "").trim()

  if (!recordId) {
    return apiError(400, "VALIDATION_ERROR", "recordId is required")
  }

  try {
    const status = await getMyLoanStatusForRecord(recordId, auth.user.id)
    return apiSuccess(status)
  } catch (error) {
    console.error("Error fetching loan status:", error)
    return apiError(500, "LOAN_STATUS_FETCH_FAILED", "Failed to fetch loan status")
  }
}
