# Migrations Order

Canonical migration order:

1. `001_initial_schema.sql`
2. `002_loans.sql`
3. `003_harden_rls.sql`\r\n4. `004_demo_seed.sql`\r\n5. `005_english_loan_fields.sql`

Notes:

- `001_create_tables.sql` was removed because it duplicated `001_initial_schema.sql`.
- Use this folder as the single source of truth for schema history.
- Apply migrations in order using Supabase CLI or your CI migration step.
