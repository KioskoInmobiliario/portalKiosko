# Portal Kiosko Inmobiliario

Portal público y panel administrativo con Next.js, preparado para Vercel y Supabase.

## Desarrollo y compilación

Requiere Node.js 24 y npm. Las dependencias están fijadas en `package-lock.json`.

```sh
npm ci
npm run dev
npm run build
npm run start
```

La compilación principal utiliza Next.js, sin manifest de Sites ni bindings de Cloudflare. `vercel.json` declara el framework y los comandos de instalación y compilación. Los archivos del runtime anterior se conservan como referencia; no participan en la compilación de la web. `tsconfig.json` comprueba los módulos de Next.js; la Edge Function de Supabase tiene su propio runtime Deno.

## Rutas

- `/`: portal público.
- `/admin/importaciones`: revisión administrativa de las filas importadas.
- `/auth/activar`: creación de contraseña desde una invitación o recuperación válida.
- `/api/admin/imports`: intermediario de servidor hacia la Edge Function de Supabase.
- `/borrador-cuentas`: referencia visual del futuro portal de documentos.

La clave publishable de Supabase es pública por diseño. No incluir claves secretas o de servicio en variables públicas ni en GitHub. La autorización administrativa se comprueba en Supabase; la página pública no entrega los datos importados.

## Publicación

Consultar [la guía de Vercel](docs/publicacion-vercel.md). La configuración está preparada, pero no acredita que exista un proyecto conectado o un despliegue remoto.

## Comprobaciones

```sh
npm run build
npx tsc --noEmit --incremental false
node --test tests/rendered-html.test.mjs tests/admin-review.test.mjs tests/auth-activation.test.mjs
```

Las pruebas de navegador `tests/admin-panel-browser.mjs` y `tests/auth-activation-browser.mjs` requieren Playwright, Chromium y el portal corriendo en localhost:3000. Usan respuestas sintéticas, sin cuentas reales. Puede indicarse un ejecutable Chromium mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

Consultar [el panel administrativo](docs/panel-administrativo-importaciones.md) para el backend aplicado, revisión de filas y restricciones de acceso.
