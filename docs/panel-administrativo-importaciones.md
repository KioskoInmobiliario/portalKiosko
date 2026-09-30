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

Se invitó a `contacto@kioskoinmobiliario.com` desde Supabase Auth. Su registro administrativo permanece con `active=false` mientras confirma el correo y configura su contraseña. Una sesión en el dashboard de Supabase no equivale a una cuenta de esta aplicación.

Para habilitar al primer administrador, identificar primero su correo y crear o invitar esa cuenta desde Authentication en Supabase. No guardar contraseñas en GitHub ni enviarlas por esta conversación. Después, un operador autorizado del proyecto ejecuta la asignación para una cuenta existente y confirmada:

```sql
insert into public.ki_admins(user_id)
select id from auth.users
where lower(email)=lower('CORREO_ADMINISTRATIVO_CONFIRMADO')
  and email_confirmed_at is not null
on conflict(user_id) do update set active=true;
```

Verificar que se asignó exactamente una cuenta. Para revocar acceso, cambiar `active` a `false`; las operaciones consultan este valor en cada llamada. La cuenta no puede asignarse permisos a sí misma desde el portal.

La sesión del panel se mantiene en memoria; no almacena tokens en localStorage ni cookies. Una recarga o un token vencido requiere iniciar sesión de nuevo. Se incluye cierre de sesión. Google y el formulario para solicitar recuperación pertenecen a una siguiente implementación.

## Activación y publicación pendiente

La ruta `/auth/activar` recibe enlaces de invitación o recuperación con sesión en el fragmento de la URL. Elimina ese fragmento del historial, valida la identidad confirmada directamente contra Supabase Auth y permite guardar una contraseña de al menos 12 caracteres. No asigna permisos administrativos. La contraseña se envía directamente a Supabase y no se guarda en la aplicación. Al terminar cierra la sesión de activación.

El identificador original del Site, recuperado del archivo fuente del repositorio, es `appgprj_6a6165cbda2c81919c7d15148b65d30c`. La conexión actual de Sites devuelve `NOT_FOUND` para ese proyecto y solo muestra un sitio ajeno a Kiosko. Por ello no se publicó ni se sustituyó otro sitio.

Para completar el acceso falta conectar la cuenta que contiene el Portal Kiosko e identificar su URL real. Después de publicar, configurar en Supabase Auth el Site URL de producción y permitir exactamente la URL de `/auth/activar`. La nueva invitación debe especificar esa ruta como `redirectTo`; permitir una URL por sí solo no cambia el destino de las invitaciones. La invitación anterior fue emitida cuando el Site URL era localhost y no debe darse por operativa en producción. No se modificó todavía esa configuración ni se envió otra invitación.

Una vez confirmada la cuenta, habilitar exclusivamente su fila de `ki_admins` mediante la asignación anterior y comprobar inicio de sesión y listado. La configuración de contraseña corresponde al titular de la cuenta.

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
- Activación: dos pruebas de validación y prueba de navegador con respuestas sintéticas; verificación de identidad, eliminación del fragmento, contraseña, cierre de sesión, enlace ausente y vista móvil. Compilación y tipos aprobados.
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
