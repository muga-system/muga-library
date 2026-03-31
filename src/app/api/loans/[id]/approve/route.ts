import { approveLoan } from "@/lib/services/database"
import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { approveLoanSchema, idParamSchema } from "@/lib/api/schemas"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsedParams = idParamSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError(400, "VALIDATION_ERROR", parsedParams.error.issues[0]?.message ?? "Invalid id")
  }

  const parsedBody = await parseJsonBody(request, approveLoanSchema)
  if (!parsedBody.success) return parsedBody.response

  try {
    const loan = await approveLoan(parsedParams.data.id, auth.user.id)
    if (!loan) {
      return apiError(404, "LOAN_NOT_FOUND", "Loan not found")
    }

    return apiSuccess(loan)
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LOAN_STATE") {
      return apiError(409, "INVALID_LOAN_STATE", "Only requested loans can be approved")
    }
    if (error instanceof Error && error.message === "NO_AVAILABLE_COPIES") {
      return apiError(409, "NO_AVAILABLE_COPIES", "No available copies to approve this loan")
    }
    console.error("Error approving loan:", error)
    return apiError(500, "LOAN_APPROVE_FAILED", "Failed to approve loan")
  }
}
