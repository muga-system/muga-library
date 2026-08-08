import { z } from "zod"

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
})

export const createDatabaseSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(255, "name is too long"),
  description: z.string().trim().max(2000, "description is too long").optional(),
})

export const updateDatabaseSchema = createDatabaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required")

export const recordsQuerySchema = z.object({
  databaseId: z.string().uuid("Invalid databaseId format").optional(),
  q: z.string().trim().min(1, "q cannot be empty").max(200, "q is too long").optional(),
  limit: z.coerce.number().int().min(1, "limit must be >= 1").max(200, "limit must be <= 200").default(50),
  offset: z.coerce.number().int().min(0, "offset must be >= 0").default(0),
})

export const createRecordSchema = z.object({
  database_id: z.string().uuid("Invalid database_id format"),
  data: z.record(z.string(), z.unknown()),
  total_ejemplares: z.coerce.number().int().min(0, "total_ejemplares must be >= 0").optional(),
  disponibles: z.coerce.number().int().min(0, "disponibles must be >= 0").optional(),
})

export const batchCreateRecordsSchema = z.object({
  database_id: z.string().uuid("Invalid database_id format"),
  records: z.array(z.object({
    data: z.record(z.string(), z.unknown()),
    total_ejemplares: z.coerce.number().int().min(0).optional(),
    disponibles: z.coerce.number().int().min(0).optional(),
  })).min(1, "At least one record is required").max(1000, "Maximum 1000 records per batch"),
})

export const updateRecordSchema = z
  .object({
    data: z.record(z.string(), z.unknown()).optional(),
    total_ejemplares: z.coerce.number().int().min(0, "total_ejemplares must be >= 0").optional(),
    disponibles: z.coerce.number().int().min(0, "disponibles must be >= 0").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required")

export const loansQuerySchema = z.object({
  status: z.enum(["requested", "active", "returned", "rejected", "overdue"]).optional(),
  stats: z.enum(["true", "false"]).optional(),
})

export const createLoanSchema = z.object({
  database_id: z.string().uuid("Invalid database_id format"),
  record_id: z.string().uuid("Invalid record_id format"),
  borrower_type: z.enum(["reader", "student", "teacher"]),
  borrower_name: z.string().trim().min(1, "borrower_name is required").max(255, "borrower_name is too long"),
  borrower_course: z.string().trim().max(10, "borrower_course is too long").optional(),
  borrower_division: z.string().trim().max(5, "borrower_division is too long").optional(),
  borrower_department: z.string().trim().max(100, "borrower_department is too long").optional(),
  notes: z.string().trim().max(1000, "notes is too long").optional(),
  public_request: z.boolean().optional(),
})

export const updateLoanSchema = z.object({
  action: z.literal("return"),
})

export const approveLoanSchema = z.object({
  action: z.literal("approve"),
})

export const rejectLoanSchema = z.object({
  action: z.literal("reject"),
  reason: z.string().trim().max(1000).optional(),
})

export const updateSettingsSchema = z.object({
  settings: z.object({
    notificaciones: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    autoBackup: z.boolean().optional(),
    itemsPerPage: z.enum(["25", "50", "100"]).optional(),
    catalogingStandard: z.enum(["MARC 21", "UNIMARC", "Dublin Core"]).optional(),
    classificationStandard: z.enum([
      "CDU - Clasificación Decimal Universal",
      "LC - Library of Congress",
      "DDC - Dewey Decimal Classification",
    ]).optional(),
  }).optional(),
  profile: z.object({
    full_name: z.string().trim().max(200, "full_name is too long").optional(),
    library_name: z.string().trim().max(255, "library_name is too long").optional(),
    avatar_url: z.union([
      z.string().max(2048).url(),
      z.string().max(2048).regex(/^\/api\/uploads\/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp|gif)$/i),
      z.literal(""),
    ]).optional(),
    email: z.string().trim().email().max(320).optional(),
    current_password: z.string().min(1).max(128).optional(),
    password: z.string().min(8).max(128).optional(),
  }).optional(),
}).superRefine((value, context) => {
  if (!value.settings && !value.profile) {
    context.addIssue({ code: "custom", message: "settings or profile is required", path: [] })
  }

  const changesSensitiveData = Boolean(value.profile?.email || value.profile?.password)
  if (changesSensitiveData && !value.profile?.current_password) {
    context.addIssue({ code: "custom", message: "current_password is required for email or password changes", path: ["profile", "current_password"] })
  }
})

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
})

export const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
})

export const activateCouponSchema = z.object({
  code: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  libraryName: z.string().trim().min(1).max(255),
  libraryDescription: z.string().trim().max(2000).optional(),
})

export const couponRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  libraryName: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
})

export const processCouponRequestSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().trim().max(2000).optional(),
})

export const manualCouponSchema = z.object({
  createForEmail: z.string().trim().email().max(320),
  libraryName: z.string().trim().min(1).max(255),
})
