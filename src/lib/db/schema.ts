import { pgTable, uuid, varchar, text, timestamp, integer, boolean, serial, jsonb, date, index } from 'drizzle-orm/pg-core';

// Catalogs / Databases
export const databases = pgTable('databases', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Records (Books)
export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  databaseId: uuid('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
  mfn: serial('mfn'),
  data: jsonb('data').notNull().default({}),
  totalEjemplares: integer('total_ejemplares').default(1),
  disponibles: integer('disponibles').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  databaseIdx: index('idx_records_database').on(table.databaseId),
}));

// Loans
export const loans = pgTable('loans', {
  id: uuid('id').defaultRandom().primaryKey(),
  databaseId: uuid('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
  recordId: uuid('record_id').notNull().references(() => records.id, { onDelete: 'cascade' }),
  
  // Borrower
  borrowerType: varchar('borrower_type', { length: 20 }).notNull(),
  borrowerName: varchar('borrower_name', { length: 255 }).notNull(),
  borrowerCourse: varchar('borrower_course', { length: 10 }),
  borrowerDivision: varchar('borrower_division', { length: 5 }),
  borrowerDepartment: varchar('borrower_department', { length: 100 }),
  
  // Dates
  loanDate: date('loan_date').notNull().default('now'),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'),
  
  // Notes
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('idx_loans_status').on(table.status),
  recordIdx: index('idx_loans_record').on(table.recordId),
}));

// Loan Config
export const loanConfig = pgTable('loan_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// CDU Classes
export const cduClasses = pgTable('cdu_classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  parentCode: varchar('parent_code', { length: 10 }),
  description: text('description'),
  examples: jsonb('examples'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Record Versions (History)
export const recordVersions = pgTable('record_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').notNull().references(() => records.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  versionNumber: integer('version_number').notNull(),
  changedBy: varchar('changed_by', { length: 255 }),
  changeType: varchar('change_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Field Definitions
export const fieldDefinitions = pgTable('field_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  databaseId: uuid('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 10 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('text'),
  isRepeatable: boolean('is_repeatable').default(false),
  isSubfield: boolean('is_subfield').default(false),
  parentTag: varchar('parent_tag', { length: 10 }),
  required: boolean('required').default(false),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Import Jobs
export const importJobs = pgTable('import_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  databaseId: uuid('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  format: varchar('format', { length: 50 }).notNull(),
  totalRecords: integer('total_records').default(0),
  processedRecords: integer('processed_records').default(0),
  status: varchar('status', { length: 50 }).default('pending'),
  errors: jsonb('errors'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Export Jobs
export const exportJobs = pgTable('export_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  databaseId: uuid('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 50 }).notNull(),
  filters: jsonb('filters'),
  totalRecords: integer('total_records').default(0),
  status: varchar('status', { length: 50 }).default('pending'),
  filePath: text('file_path'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Search Index
export const searchIndex = pgTable('search_index', {
  id: uuid('id').defaultRandom().primaryKey(),
  databaseId: uuid('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
  recordId: uuid('record_id').notNull().references(() => records.id, { onDelete: 'cascade' }),
  searchVector: text('search_vector'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type Database = typeof databases.$inferSelect;
export type Record = typeof records.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type LoanConfig = typeof loanConfig.$inferSelect;
export type CduClass = typeof cduClasses.$inferSelect;
export type RecordVersion = typeof recordVersions.$inferSelect;
export type FieldDefinition = typeof fieldDefinitions.$inferSelect;
export type ImportJob = typeof importJobs.$inferSelect;
export type ExportJob = typeof exportJobs.$inferSelect;
export type SearchIndexEntry = typeof searchIndex.$inferSelect;
