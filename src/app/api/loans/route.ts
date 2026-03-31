import { getAllLoans, createLoan, getLoanStats } from "@/lib/services/database"
import { requireApiAdmin, requireApiUser } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { createLoanSchema, loansQuerySchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const parsedQuery = loansQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    stats: searchParams.get("stats") ?? undefined,
  })

  if (!parsedQuery.success) {
    return apiError(400, "VALIDATION_ERROR", parsedQuery.error.issues[0]?.message ?? "Invalid query params")
  }

  try {
    if (parsedQuery.data.stats === "true") {
      const loanStats = await getLoanStats()
      return apiSuccess(loanStats)
    }

    const loans = await getAllLoans(parsedQuery.data.status)
    return apiSuccess(loans)
  } catch (error) {
    console.error("Error fetching loans:", error)
    return apiError(500, "LOANS_FETCH_FAILED", "Failed to fetch loans")
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, createLoanSchema)
  if (!parsed.success) return parsed.response

  try {
    const loan = await createLoan({
      databaseId: parsed.data.database_id,
      recordId: parsed.data.record_id,
      borrowerType: parsed.data.borrower_type,
      borrowerName: parsed.data.borrower_name,
      borrowerCourse: parsed.data.borrower_course,
      borrowerDivision: parsed.data.borrower_division,
      borrowerDepartment: parsed.data.borrower_department,
      notes: parsed.data.notes,
      createdBy: auth.user.id,
      publicRequest: parsed.data.public_request,
    })
    return apiSuccess(loan, 201)
  } catch (error) {
    console.error("Error creating loan:", error)
    if (error instanceof Error && error.message === "DUPLICATE_ACTIVE_LOAN") {
      return apiError(409, "DUPLICATE_ACTIVE_LOAN", "Ya tienes un prestamo activo para este libro")
    }
    return apiError(500, "LOAN_CREATE_FAILED", "Failed to create loan")
  }
}
