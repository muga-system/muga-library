# Guion de demo (3 minutos)

## Objetivo
Mostrar rápidamente el valor completo: login, gestión del catálogo, alta de
registros, ciclo del préstamo y búsqueda.

## Preparación
- La aplicación está saludable en el entorno de prueba.
- Las migraciones SQLite están aplicadas (`pnpm db:migrate`).
- Existe un administrador creado mediante el bootstrap protegido.
- No hay credenciales de demo versionadas.
- El navegador empieza en `/iniciar-sesion`.

## Secuencia
1. Iniciar sesión y abrir el panel.
2. Ir a `Bases de Datos`.
3. Crear un registro con título, autor e ISBN.
4. Ir a `Préstamos > Nuevo préstamo` y registrar el préstamo.
5. Abrir el detalle y ejecutar la devolución.
6. Ir a `Buscar` y encontrar el registro por título.

## Resultado esperado
- Las estadísticas se actualizan en el panel y en préstamos.
- El estado cambia de `activo` a `devuelto`.
- La búsqueda devuelve el registro creado.

## Plan B
- Si falla la API, mostrar la página de error global y usar `Reintentar`.
- Si el catálogo está vacío, crear un registro manualmente y continuar.
