# MUGA Books Register

Modern library management app (Next.js + Supabase + PostgreSQL) inspired by J-ISIS workflows.

## Stack
- Next.js 16 (App Router)
- React 19
- Supabase Auth + Postgres
- Drizzle ORM
- Vitest + Testing Library
- Tailwind CSS

## Required environment variables
Copy `.env.example` to `.env.local` and set real values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_SECRET` (optional but required to use `/api/create-admin`)
- `ADMIN_EMAIL` (optional)
- `ADMIN_PASSWORD` (required for `/api/create-admin`)

## Local setup (under 10 minutes)
1. `npm ci`
2. Configure `.env.local`
3. Run migrations in order:
   1. `supabase/migrations/001_initial_schema.sql`
   2. `supabase/migrations/002_loans.sql`
   3. `supabase/migrations/003_harden_rls.sql`
4. Optional demo data: run `supabase/seeds/demo_seed.sql`
5. Start dev server: `npm run dev`
6. Open `http://localhost:3000`

## Quality gate before release
Run:

```bash
npm run check
```

`check` runs lint + typecheck + tests + production build. Release should only happen if this passes.

## API security model
- All app API routes require authenticated Supabase user session.
- Payload validation is enforced with Zod.
- Error contract is standardized: `{ error, code }`.
- `/api/create-admin` is protected by:
  - disabled in production (`404`)
  - bootstrap secret header: `x-admin-bootstrap-secret`

## Deploy on Vercel + Supabase
1. Push repository to GitHub.
2. Import project in Vercel.
3. Configure all environment variables from `.env.example` in Vercel Project Settings.
4. Ensure Supabase DB has the latest migrations.
5. Trigger deploy.
6. Run smoke test flow:
   1. Login
   2. Create database
   3. Create record
   4. Create and return loan
   5. Search record

## CI
GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline steps:
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

## Demo credentials and flow
- Keep demo credentials in your secure environment manager.
- Do not store real credentials in repo.
- Use `docs/demo-script.md` for the 3-minute presentation flow.

## Notes about RLS
- Initial permissive policies were replaced by authenticated policies in `003_harden_rls.sql`.
- Keep RLS strict for preview/production environments.
