# QA checklist: loan request workflow

Use this list before final deploy.

## Preconditions

- User account with normal role (not admin).
- Admin account with access to `/admin`.
- At least one record with `disponibles > 0`.
- Optional: one record with `disponibles = 0` for stock edge case.

## Public flow checks

1. Login as normal user and open `/`.
2. Verify header shows `Mis solicitudes`.
3. Open a book in `/libro/[id]` and click `Solicitar prestamo`.
4. Submit form in `/solicitar/[recordId]`.
5. Confirm redirect and success message.
6. Return to `/libro/[id]` and verify CTA says pending approval.
7. Try to open `/solicitar/[recordId]` again and verify duplicate guard redirect.

## Admin approval checks

1. Login as admin and open `/admin/solicitudes`.
2. Confirm pending request appears.
3. Approve request.
4. Verify request disappears from pending queue.
5. Open `/prestamos` and verify status renders as active (or overdue if date is old).
6. Verify `disponibles` decreased by 1 only once.

## Admin rejection checks

1. Create another request as normal user.
2. Reject from `/admin/solicitudes` with a reason.
3. Open `/mis-solicitudes` as normal user and verify rejected state + reason.
4. Open `/libro/[id]` and verify CTA shows rejected message and `Solicitar nuevamente`.

## Return flow checks

1. From admin loan detail (`/prestamos/[id]`), return an active/overdue loan.
2. Verify status changes to returned.
3. Verify `disponibles` increased by 1 only once.

## Status UI checks

Verify badges and filters support all statuses in:

- `/prestamos`
- `/prestamos/historial`
- `/prestamos/[id]`
- `/mis-solicitudes`

Expected statuses: `requested`, `active`, `overdue`, `rejected`, `returned`.
