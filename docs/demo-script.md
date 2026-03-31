# Demo Script (3 minutes)

## Goal
Show complete value quickly: login, catalog management, record creation, loan lifecycle, and search.

## Pre-demo checklist
- Deploy preview is healthy.
- Demo seed is loaded (`supabase/seeds/demo_seed.sql`).
- Demo user can login.
- Browser starts at `/iniciar-sesion`.

## Script
1. Login with demo user and open dashboard.
2. Go to `Bases de Datos` and show existing `Catalogo General`.
3. Open catalog and create one new record with title/author/ISBN.
4. Go to `Prestamos > Nuevo Prestamo` and register a loan for that record.
5. Open loan detail and click return action.
6. Go to `Buscar` and find the record by title.

## Expected outcomes
- Stats update in dashboard and loans page.
- Loan status changes from `activo` to `devuelto`.
- Search returns seeded and newly created records.

## Backup plan
- If API fails, show the global error page and use `Reintentar`.
- If seed was not loaded, create one record manually and continue script.