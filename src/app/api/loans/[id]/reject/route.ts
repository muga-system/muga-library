import { rejectLoan } from "@/lib/services/database"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { idParamSchema, rejectLoanSchema } from "@/lib/api/schemas"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  const parsedBody = await parseJsonBody(request, rejectLoanSchema)
  if (!parsedBody.success) return parsedBody.response

  try {
    const loan = await rejectLoan(parsedParams.data.id, parsedBody.data.reason)
    if (!loan) {
      return apiError(404, "LOAN_NOT_FOUND", "Loan not found")
    }

    return apiSuccess(loan)
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LOAN_STATE") {
      return apiError(409, "INVALID_LOAN_STATE", "Only requested loans can be rejected")
    }
    console.error("Error rejecting loan:", error)
    return apiError(500, "LOAN_REJECT_FAILED", "Failed to reject loan")
  }
}
