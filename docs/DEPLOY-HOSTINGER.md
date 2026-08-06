# Publicar en Hostinger: bibliotecas.muga.dev

MUGA Bibliotecas es una aplicación Next.js con SSR, API, SQLite y archivos persistentes. Para esta arquitectura se debe usar una aplicación Node.js de Hostinger; no alcanza con subir solamente el contenido de `out` o de `public_html`.

## 1. Antes de subir

1. Crear un backup local:

   ```bash
   pnpm db:backup
   ```

2. Verificar localmente:

   ```bash
   pnpm check
   ```

3. Confirmar que el repositorio contiene `drizzle/0002_flippant_maverick.sql` y que no se está versionando `.env.local`, `data/` ni `backups/`.

## 2. Aplicación Node.js

En Hostinger crear una aplicación Node.js con estos valores iniciales:

| Campo | Valor |
|---|---|
| Versión de Node | 22.x |
| Gestor de paquetes | `npm` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Application root | raíz del repositorio |
| Document root | el que asigne Hostinger; no usarlo como raíz de SQLite |

Hostinger documenta que sus aplicaciones Node.js pueden ejecutar Next.js con backend/API. La configuración exacta de la pantalla puede variar según el plan y el panel activo: [guía oficial de Node.js en Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) y [hosting oficial para Next.js](https://www.hostinger.com/web-apps-hosting/nextjs-hosting).

## 3. Variables de entorno

Configurar estas variables en el panel, nunca en Git:

```dotenv
NODE_ENV=production
DATABASE_URL=file:./data/muga-library.db
UPLOADS_DIR=./data/uploads
NEXT_PUBLIC_APP_URL=https://bibliotecas.muga.dev

ADMIN_BOOTSTRAP_ENABLED=false
ADMIN_BOOTSTRAP_SECRET=<secreto-largo-y-aleatorio>
ADMIN_EMAIL=<email-administrador>
ADMIN_PASSWORD=<contraseña-fuerte>

HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
HOSTINGER_SMTP_USER=bibliotecas@muga.dev
HOSTINGER_SMTP_PASSWORD=<contraseña-del-buzón>
HOSTINGER_MAIL_DISPLAY_NAME=MUGA
COUPON_REQUEST_NOTIFICATION_EMAIL=bibliotecas@muga.dev
```

Crear `data/` y `data/uploads/` en el almacenamiento persistente de la aplicación. Después de subir un backup de una instalación existente, ejecutar:

```bash
pnpm db:migrate
```

La migración es idempotente porque `scripts/migrate-db.ts` registra cada archivo aplicado en SQLite.

La aplicación usa el SQLite nativo de Node (`node:sqlite`) y requiere Node 22.5 o superior. No hace falta crear ni configurar una base MySQL de Hostinger: la base operativa es el archivo SQLite persistente indicado por `DATABASE_URL`.

## 4. Dominio y primera comprobación

Apuntar `bibliotecas.muga.dev` a la aplicación Node.js desde el panel de Hostinger y esperar a que el certificado HTTPS quede activo. Luego comprobar:

```text
https://bibliotecas.muga.dev/api/health
https://bibliotecas.muga.dev/catalogo
https://bibliotecas.muga.dev/robots.txt
https://bibliotecas.muga.dev/sitemap.xml
```

`/api/health` debe responder `200` con `{ "ok": true }`. Probar también el flujo real de solicitud de incorporación, recepción del email, aprobación, activación y primer login.

## 5. Backups y restauración

Crear backups periódicos desde la raíz de la aplicación:

```bash
pnpm db:backup
```

El backup guarda una copia consistente de SQLite, `uploads/` y un `manifest.json` dentro de `backups/`. Descargar esas carpetas fuera de Hostinger.

Para restaurar, detener la aplicación, verificar el directorio elegido y ejecutar explícitamente:

```bash
pnpm db:restore backups/<fecha> --force
```

Volver a ejecutar `pnpm db:migrate` y arrancar la aplicación. La restauración no debe hacerse con la aplicación escribiendo sobre la base al mismo tiempo.

## 6. Checklist de salida

- [ ] El panel Node.js informa estado `running`.
- [ ] HTTPS y `bibliotecas.muga.dev` cargan la aplicación, no la página por defecto.
- [ ] `/api/health` responde 200.
- [ ] `NODE_ENV`, rutas persistentes y SMTP están configurados en Hostinger.
- [ ] Se ejecutó `pnpm db:migrate` en el servidor.
- [ ] Se probó login, logout, creación de catálogo, carga de imagen, importación CSV/XLSX y préstamo.
- [ ] Se probó una solicitud de incorporación completa con emails reales.
- [ ] Existe un backup descargado y se conoce el procedimiento de restore.
- [ ] No se publicó ningún `.env`, backup o base SQLite en el repositorio.
