import { getMyLoans } from "@/lib/services/database"
import { requireApiUser } from "@/lib/api/auth"
import { apiError, apiSuccess } from "@/lib/api/http"

export async function GET() {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  try {
    const loans = await getMyLoans(auth.user.id)
    return apiSuccess(loans)
  } catch (error) {
    console.error("Error fetching my loans:", error)
    return apiError(500, "MY_LOANS_FETCH_FAILED", "Failed to fetch my loans")
  }
}
