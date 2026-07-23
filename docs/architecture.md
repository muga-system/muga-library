# Arquitectura de MUGA Books

## Dirección propuesta para la migración

> Estado: objetivo arquitectónico; la implementación se hará por etapas para
> mantener el proyecto ejecutable durante la transición.

MUGA Books conserva Next.js porque necesita autenticación, catálogo compartido,
préstamos, solicitudes, administración y rutas de servidor. No se convierte en
un sitio Astro estático: el modelo de Muga Lab basado en `localStorage` sirve
para progreso personal, pero no para datos bibliotecarios compartidos.

La dirección de simplificación es:

- `pnpm` como gestor único de dependencias.
- Drizzle como única capa de acceso a datos.
- SQLite para desarrollo y despliegues Node de una sola instancia.
- Una capa de persistencia aislada para poder cambiar SQLite local por libSQL o
  D1 si el despliegue futuro lo requiere.
- Autenticación y autorización resueltas por el servidor, sin clientes de base
  de datos en el navegador.
- Archivos subidos guardados fuera de la base, en un directorio configurable.
- Resend permanece opcional y solo se usa para notificaciones de email.

## Principios heredados de Muga Lab

- Una responsabilidad por módulo.
- Contenido, dominio, persistencia e interfaz separados.
- Componentes pequeños y reutilizables.
- TypeScript estricto y validación en los límites.
- Decisiones importantes documentadas.

## Despliegue

SQLite requiere un proceso Node persistente y un directorio de datos escribible.
Por eso no debe desplegarse como función efímera sin almacenamiento persistente.
En un entorno serverless se podrá cambiar el adaptador por libSQL/D1 sin
modificar las páginas ni los servicios de dominio.
