# MUGA Books Register

Modern library management app (Next.js + SQLite + Drizzle) inspired by J-ISIS workflows.

La dirección propuesta para simplificar la infraestructura está documentada en
[`docs/architecture.md`](docs/architecture.md).

## Stack
- Next.js 16 (App Router)
- React 19
- SQLite + Drizzle ORM
- Sesiones HTTP propias + bcrypt
- Vitest + Testing Library
- Tailwind CSS

## Required environment variables
Copy `.env.example` to `.env.local` and set real values:

- `DATABASE_URL` (opcional; por defecto `file:./data/muga-library.db`)
- `UPLOADS_DIR` (opcional; por defecto `data/uploads`)
- `ADMIN_BOOTSTRAP_ENABLED`
- `ADMIN_BOOTSTRAP_SECRET` (optional but required to use `/api/create-admin`)
- `ADMIN_EMAIL` (optional)
- `ADMIN_PASSWORD` (required for `/api/create-admin`)
- `HOSTINGER_EMAIL_API_URL` (optional; defaults to `https://api.mail.hostinger.com`)
- `HOSTINGER_EMAIL_API_TOKEN` (required Hostinger Mail API bearer token)
- `HOSTINGER_MAILBOX_RESOURCE_ID` (required resource ID of the Hostinger mailbox used to send mail)
- `HOSTINGER_MAIL_DISPLAY_NAME` (optional sender display name; defaults to `MUGA`)
- `COUPON_REQUEST_NOTIFICATION_EMAIL` (address that receives new library requests; falls back to `ADMIN_EMAIL`)
- `NEXT_PUBLIC_APP_URL` (optional base URL included in email links)

## Local setup (under 10 minutes)
1. `pnpm install`
2. Configure `.env.local`
3. Apply SQLite migrations: `pnpm db:migrate`
4. Optional: create an admin with `/api/create-admin` using the bootstrap secret.
5. Start dev server: `pnpm dev`
6. Open `http://localhost:3000`

## Quality gate before release
Run:

```bash
pnpm check
```

`check` runs lint + typecheck + tests + production build. Release should only happen if this passes.

## API security model
- All protected API routes require an authenticated local session.
- Payload validation is enforced with Zod.
- Error contract is standardized: `{ error, code }`.
- `/api/create-admin` is protected by:
  - disabled in production (`404`)
  - bootstrap secret header: `x-admin-bootstrap-secret`

## Deploy on a persistent Node server
1. Push repository to GitHub.
2. Configure `.env.local` with a writable `DATABASE_URL`.
3. Run `pnpm install --frozen-lockfile` and `pnpm db:migrate`.
4. Build with `pnpm build` and start with `pnpm start`.
5. Run smoke test flow:
   1. Login
   2. Create database
   3. Create record
   4. Create and return loan
   5. Search record

## CI
GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline steps:
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:run`
- `pnpm build`

## Demo credentials and flow
- Keep demo credentials in your secure environment manager.
- Do not store real credentials in repo.
- Use `docs/demo-script.md` for the 3-minute presentation flow.

## Legacy migrations

The original PostgreSQL/Supabase migrations remain in `supabase/migrations/`
as historical reference. New environments use the Drizzle migrations in
`drizzle/`.
