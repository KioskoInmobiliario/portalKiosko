# Panel administrativo de importaciones

Ruta implementada: `/admin/importaciones`, en la rama `borrador/estados-cuenta-propietarios-inquilinos`. La interfaz se guarda en GitHub; no se ha publicado esta rama en la web de producción.

## Funciones

- Inicio de sesión con correo y contraseña de Supabase Auth.
- Selección de lote, búsqueda y filtros de estado y observaciones de origen.
- Comparación con los valores originales del Excel; correcciones persistentes separadas de los originales.
- Selección explícita de propietario, inquilino y contrato existentes. No se fusionan personas por nombre o correo.
- Guardado de borradores, rechazo con nota, reapertura y aprobación con confirmación.
- Incorporación atómica de inmueble, personas, contrato y relaciones; historial de decisiones.
- Bloqueo de edición de filas incorporadas, códigos de inmueble únicos y control de versiones para evitar sobrescribir otra revisión.

Las 93 filas originales siguen pendientes. Las pruebas no aprobaron registros reales.

## Acceso administrativo

Supabase Auth no contiene todavía usuarios del portal, y `ki_admins` está vacía. Una sesión en el dashboard de Supabase no equivale a una cuenta de esta aplicación.

Para habilitar al primer administrador, identificar primero su correo y crear o invitar esa cuenta desde Authentication en Supabase. No guardar contraseñas en GitHub ni enviarlas por esta conversación. Después, un operador autorizado del proyecto ejecuta la asignación para una cuenta existente y confirmada:

```sql
insert into public.ki_admins(user_id)
select id from auth.users
where lower(email)=lower('CORREO_ADMINISTRATIVO_CONFIRMADO')
  and email_confirmed_at is not null
on conflict(user_id) do update set active=true;
```

Verificar que se asignó exactamente una cuenta. Para revocar acceso, cambiar `active` a `false`; las operaciones consultan este valor en cada llamada. La cuenta no puede asignarse permisos a sí misma desde el portal.

La sesión del panel se mantiene en memoria; no almacena tokens en localStorage ni cookies. Una recarga o un token vencido requiere iniciar sesión de nuevo. Se incluye cierre de sesión. Google y recuperación de contraseña pertenecen a una siguiente implementación; no se presentan como opciones operativas.

## Incorporación

La revisión exige referencia de contrato, fecha, código único de inmueble, dirección, nombres, canon, administración y nota. Los contactos opcionales deben ser válidos cuando se suministran; documentos se completan en pares tipo/número. El total se calcula desde canon y administración.

Las referencias repetidas requieren una decisión expresa documentada. Si el contrato ya existe, debe seleccionarse; referencia, fecha, importes y seguro deben coincidir. Para una referencia que realmente corresponde a otro contrato, corregirla y documentar el motivo. Los códigos de inmueble existentes provocan rechazo de la operación: no se actualizan ni fusionan inmuebles automáticamente.

Sin documento se puede crear una persona independiente pendiente, con confirmación expresa del administrador. Las personas nuevas, inmuebles y contratos se incorporan en estado `pending`. La aprobación de la fila no verifica identidades, no crea vínculos de cuenta y no habilita documentos ni lectura de propietarios/inquilinos. No se activan cuentas a partir de nombres de Excel.

La incorporación es una transacción PostgreSQL, con bloqueo de fila, bloqueo compartido de importaciones y comprobación de versión. Cualquier fallo revierte todos los registros de esa operación. Una fila incorporada no se aplica dos veces. Los valores originales se mantienen intactos; `ki_import_audit` conserva actor, fecha, decisión, versiones de datos y entidades generadas.

## Backend aplicado

- Migración generada con CLI: `supabase/migrations/20260930014106_kiosko_admin_review.sql`.
- Historial remoto: `20260930014132 — kiosko_admin_review`.
- Tablas adicionales `ki_admins` y `ki_import_audit`, con RLS y sin permisos para `anon` o `authenticated`.
- Funciones `ki_admin_require`, `ki_admin_list` y `ki_admin_review`, SECURITY INVOKER y ejecución restringida a `service_role`.
- Edge Function `kiosko-admin`, desplegada y activa en el proyecto `samqjwhcaksorgvsyssv`.
- Ruta del servidor `/api/admin/imports` como intermediaria hacia la Edge Function.

La Edge Function valida el token consultando Supabase Auth y usa exclusivamente el ID de la identidad comprobada, nunca un actor enviado por el cliente ni `user_metadata`. La función PostgreSQL vuelve a comprobar la autorización administrativa vigente. Las claves privilegiadas se obtienen del entorno de Supabase; no están en el navegador, la web ni GitHub.

La clave publishable de `lib/kiosko-config.ts` es pública por diseño. `verify_jwt=false` en la Edge Function permite el modelo actual de claves; la autenticación obligatoria se implementa explícitamente en `handler.ts` con Auth y autorización vigente. No significa acceso anónimo permitido. Sin CORS directo: el navegador utiliza la ruta del propio portal.

El listado inicial entrega el lote completo, adecuado para las 93 filas actuales. Antes de manejar importaciones mucho mayores, implementar paginación y filtrado en servidor.

## Validación

- Compilación vinext completa y validación del artefacto: aprobadas.
- Tipos del módulo administrativo: `npx tsc -p tsconfig.admin.json`, aprobado.
- Cinco pruebas de validación y autorización: `node --experimental-strip-types tests/admin-review.test.mjs`, aprobadas.
- Prueba PostgreSQL con rollback: rechazo, reapertura, validación, versión antigua, incorporación y relaciones, segundo intento bloqueado, auditoría y ausencia de cuentas activadas. Resultado final: 93 filas pendientes, cero clientes y cero auditorías de prueba.
- Edge Function real sin sesión: HTTP 401; roles anon/authenticated sin ejecución directa de RPCs.
- Prueba de navegador con datos sintéticos: inicio de sesión, guardado, confirmación antes de escribir, incorporación y vista móvil sin desbordamiento ni errores de JavaScript. Script `tests/admin-panel-browser.mjs`; requiere Playwright y Chromium disponibles. No utiliza datos del Excel ni cuentas reales.
- Asesor de seguridad: solo avisos informativos RLS sin políticas, intencionales porque las tablas permanecen cerradas a usuarios finales.

La revisión global de tipos del repositorio ya presentaba errores en la página principal y declaraciones del runtime Cloudflare; este cambio valida sus propios módulos con `tsconfig.admin.json`. La compilación se comprobó con configuración local de bindings sin base D1 ni R2. No se asignó un Site ID ni se realizó un despliegue del frontend.

Referencias técnicas verificadas:
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
