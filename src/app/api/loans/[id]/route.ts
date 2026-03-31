import { getLoanById, returnLoan } from "@/lib/services/database"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { idParamSchema, updateLoanSchema } from "@/lib/api/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  try {
    const loan = await getLoanById(parsedParams.data.id)
    if (!loan) {
      return apiError(404, "LOAN_NOT_FOUND", "Loan not found")
    }
    return apiSuccess(loan)
  } catch (error) {
    console.error("Error fetching loan:", error)
    return apiError(500, "LOAN_FETCH_FAILED", "Failed to fetch loan")
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  const parsedBody = await parseJsonBody(request, updateLoanSchema)
  if (!parsedBody.success) return parsedBody.response

  try {
    if (parsedBody.data.action !== "return") {
      return apiError(400, "VALIDATION_ERROR", "Invalid action")
    }

    const existing = await getLoanById(parsedParams.data.id)
    if (!existing) {
      return apiError(404, "LOAN_NOT_FOUND", "Loan not found")
    }
    if (existing.status !== "active" && existing.status !== "overdue") {
      return apiError(409, "INVALID_LOAN_STATE", "Only active loans can be returned")
    }

    const loan = await returnLoan(parsedParams.data.id)
    if (!loan) {
      return apiError(404, "LOAN_NOT_FOUND", "Loan not found")
    }
    return apiSuccess(loan)
  } catch (error) {
    console.error("Error updating loan:", error)
    return apiError(500, "LOAN_UPDATE_FAILED", "Failed to update loan")
  }
}
