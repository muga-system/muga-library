# MUGA Books Register

Modern library management app (Next.js + SQLite + Drizzle) inspired by J-ISIS workflows.

La arquitectura actual y sus límites de despliegue están documentados en
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
- `HOSTINGER_SMTP_HOST` (optional; defaults to `smtp.hostinger.com`)
- `HOSTINGER_SMTP_PORT` (optional; defaults to `465`)
- `HOSTINGER_SMTP_SECURE` (optional; `true` for SSL on port `465`)
- `HOSTINGER_SMTP_USER` (required full Hostinger mailbox address used to send mail)
- `HOSTINGER_SMTP_PASSWORD` (required password of that Hostinger mailbox)
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

## Publicación en Hostinger

La instalación pública prevista es [bibliotecas.muga.dev](https://bibliotecas.muga.dev). Como el producto usa Next.js SSR/API, SQLite y uploads persistentes, se publica como aplicación Node.js de Hostinger.

La guía operativa está en [docs/DEPLOY-HOSTINGER.md](docs/DEPLOY-HOSTINGER.md). Incluye variables de entorno, migraciones, health-check, backups y restauración.

## CI
GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline steps:
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:run`
- `pnpm build`

## Demo y operación
- No hay credenciales ni seeds de demo dentro del repositorio.
- Para una demostración, creá el administrador con el bootstrap seguro y
  cargá un catálogo desde la interfaz.
- El flujo breve está en `docs/demo-script.md`.
