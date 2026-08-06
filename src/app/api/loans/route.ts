import { getAllLoans, createLoan, getLoanStats, getDatabaseById } from "@/lib/services/database"
import { requireApiStaff, requireApiUser } from "@/lib/api/auth"
import { isAdmin, isLibraryStaff } from "@/lib/auth/service"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { createLoanSchema, loansQuerySchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await requireApiStaff()
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
      const loanStats = await getLoanStats(isAdmin(auth.user) ? undefined : auth.user.id)
      return apiSuccess(loanStats)
    }

    const loans = await getAllLoans(parsedQuery.data.status, isAdmin(auth.user) ? undefined : auth.user.id)
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
    const staff = isLibraryStaff(auth.user)
    const database = await getDatabaseById(parsed.data.database_id, staff && !isAdmin(auth.user) ? auth.user.id : undefined)
    if (!database || (!staff && !database.isPublic)) {
      return apiError(404, "DATABASE_NOT_FOUND", "El catálogo solicitado no existe")
    }
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
      publicRequest: staff ? parsed.data.public_request ?? false : true,
    })
    return apiSuccess(loan, 201)
  } catch (error) {
    console.error("Error creating loan:", error)
    if (error instanceof Error && error.message === "DUPLICATE_ACTIVE_LOAN") {
      return apiError(409, "DUPLICATE_ACTIVE_LOAN", "Ya tienes un prestamo activo para este libro")
    }
    if (error instanceof Error && error.message === "NO_AVAILABLE_COPIES") {
      return apiError(409, "NO_AVAILABLE_COPIES", "No hay ejemplares disponibles para solicitar")
    }
    if (error instanceof Error && error.message === "RECORD_NOT_FOUND") {
      return apiError(404, "RECORD_NOT_FOUND", "El libro solicitado no existe en este catalogo")
    }
    return apiError(500, "LOAN_CREATE_FAILED", "Failed to create loan")
  }
}
