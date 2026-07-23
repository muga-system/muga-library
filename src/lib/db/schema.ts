import {
  integer,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID())
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>()

export const profiles = sqliteTable("profiles", {
  id: id(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  libraryName: text("library_name"),
  libraryDescription: text("library_description"),
  librarySlug: text("library_slug"),
  maxCatalogs: integer("max_catalogs").notNull().default(2),
  catalogsCreated: integer("catalogs_created").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  role: text("role").notNull().default("reader"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  emailIdx: uniqueIndex("idx_profiles_email").on(table.email),
  librarySlugIdx: uniqueIndex("idx_profiles_library_slug").on(table.librarySlug),
}))

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdx: index("idx_sessions_user_id").on(table.userId),
}))

export const databases = sqliteTable("databases", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  catalogType: text("catalog_type").notNull().default("general"),
  libraryVisibility: text("library_visibility").notNull().default("private"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  ownerIdx: index("idx_databases_owner").on(table.ownerId),
}))

export const records = sqliteTable("records", {
  id: id(),
  databaseId: text("database_id").notNull().references(() => databases.id, { onDelete: "cascade" }),
  mfn: integer("mfn"),
  data: json<globalThis.Record<string, unknown>>("data").notNull(),
  totalEjemplares: integer("total_ejemplares").notNull().default(1),
  disponibles: integer("disponibles").notNull().default(1),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  databaseIdx: index("idx_records_database").on(table.databaseId),
}))

export const loans = sqliteTable("loans", {
  id: id(),
  databaseId: text("database_id").notNull().references(() => databases.id, { onDelete: "cascade" }),
  recordId: text("record_id").notNull().references(() => records.id, { onDelete: "cascade" }),
  borrowerType: text("borrower_type").notNull(),
  borrowerName: text("borrower_name").notNull(),
  borrowerCourse: text("borrower_course"),
  borrowerDivision: text("borrower_division"),
  borrowerDepartment: text("borrower_department"),
  loanDate: text("loan_date").notNull(),
  dueDate: text("due_date").notNull(),
  returnDate: text("return_date"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdBy: text("created_by").references(() => profiles.id, { onDelete: "set null" }),
  rejectionReason: text("rejection_reason"),
  approvedBy: text("approved_by").references(() => profiles.id, { onDelete: "set null" }),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  statusIdx: index("idx_loans_status").on(table.status),
  recordIdx: index("idx_loans_record").on(table.recordId),
  borrowerIdx: index("idx_loans_created_by_record_status").on(table.createdBy, table.recordId, table.status),
}))

export const loanConfig = sqliteTable("loan_config", {
  id: id(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({ keyIdx: uniqueIndex("idx_loan_config_key").on(table.key) }))

export const cduClasses = sqliteTable("cdu_classes", {
  id: id(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  parentCode: text("parent_code"),
  description: text("description"),
  examples: json<unknown>("examples"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({ codeIdx: uniqueIndex("idx_cdu_code").on(table.code) }))

export const fieldDefinitions = sqliteTable("field_definitions", {
  id: id(),
  databaseId: text("database_id").notNull().references(() => databases.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull().default("text"),
  isRepeatable: integer("is_repeatable", { mode: "boolean" }).notNull().default(false),
  isSubfield: integer("is_subfield", { mode: "boolean" }).notNull().default(false),
  parentTag: text("parent_tag"),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({ tagIdx: uniqueIndex("idx_field_definitions_tag_db").on(table.databaseId, table.tag) }))

export const recordVersions = sqliteTable("record_versions", {
  id: id(),
  recordId: text("record_id").notNull().references(() => records.id, { onDelete: "cascade" }),
  data: json<globalThis.Record<string, unknown>>("data").notNull(),
  versionNumber: integer("version_number").notNull(),
  changedBy: text("changed_by"),
  changeType: text("change_type").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
})

export const coupons = sqliteTable("coupons", {
  id: id(),
  code: text("code").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  usedAt: text("used_at"),
  userId: text("user_id").references(() => profiles.id, { onDelete: "set null" }),
  maxUses: integer("max_uses").notNull().default(1),
  usesCount: integer("uses_count").notNull().default(0),
  createdBy: text("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  expiresAt: text("expires_at"),
}, (table) => ({ codeIdx: uniqueIndex("idx_coupons_code").on(table.code) }))

export const couponRequests = sqliteTable("coupon_requests", {
  id: id(),
  email: text("email").notNull(),
  libraryName: text("library_name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  requestedAt: text("requested_at").notNull().default("CURRENT_TIMESTAMP"),
  processedBy: text("processed_by").references(() => profiles.id, { onDelete: "set null" }),
  processedAt: text("processed_at"),
  adminNotes: text("admin_notes"),
}, (table) => ({ statusIdx: index("idx_coupon_requests_status").on(table.status) }))

export type Profile = typeof profiles.$inferSelect
export type Session = typeof sessions.$inferSelect
export type Database = typeof databases.$inferSelect
export type LibraryRecord = typeof records.$inferSelect
export type Loan = typeof loans.$inferSelect
export type LoanConfig = typeof loanConfig.$inferSelect
export type CduClass = typeof cduClasses.$inferSelect
export type RecordVersion = typeof recordVersions.$inferSelect
export type FieldDefinition = typeof fieldDefinitions.$inferSelect
export type Coupon = typeof coupons.$inferSelect
export type CouponRequest = typeof couponRequests.$inferSelect
