# Panel administrativo de importaciones

Publicado en https://portal.kioskoinmobiliario.com/admin/importaciones mediante Vercel, desde `borrador/estados-cuenta-propietarios-inquilinos`.

## Funciones actuales

- Supabase Auth con correo, contraseña, recuperación y cierre de sesión.
- Listado, búsqueda, filtros, datos originales y correcciones antes de incorporar.
- Selección explícita de personas y contratos; no fusionar por nombre o correo.
- Incorporación atómica con nota y confirmación, códigos únicos y control de versiones.
- Edición posterior del inmueble, contrato y personas vinculadas mediante Editar registros incorporados. La edición conserva IDs y relaciones.
- Historial de actor, fecha, motivo, valores anteriores y valores enviados.

El titular confirmó acceso y aclaró que el Excel contiene datos reales. Al revisar el 30 de septiembre: 1 fila incorporada y 92 pendientes. Estos datos no forman parte del código de GitHub.

## Actualización posterior

Seleccionar Incorporada, abrir la fila, activar Editar registros incorporados, cambiar datos, escribir la nota y guardar. La escritura requiere otra confirmación. No vuelve a aplicar la fila ni duplica sus entidades.

El listado devuelve valores actuales de los registros, incluso si se comparten con otra incorporación. Se controla tanto la versión de la fila como las revisiones del inmueble, contrato y personas. Un cambio simultáneo exige recargar. Los importes compartidos afectan a los inmuebles del mismo contrato; los datos personales compartidos afectan a sus otras relaciones.

La administración conserva las identidades en su estado existente. Esta edición no activa cuentas, asigna permisos, cambia las personas vinculadas ni permite descargar documentos.

## Seguridad y backend

- Membresía administrativa activa consultada en cada operación.
- Token verificado con Supabase Auth; actor obtenido del ID verificado, nunca de parámetros o metadata editables.
- Tablas con RLS, sin lectura o escritura directa para anon/authenticated.
- RPC SECURITY INVOKER restringidas a service_role. Secretos exclusivamente en el entorno de Supabase.
- Edge Function kiosko-admin, versión 2, con validación explícita de Auth; verify_jwt=false conservado del despliegue original.
- Servidor Next.js /api/admin/imports como intermediario.
- Cambios adicionales de edición: supabase/admin-edit.sql, aplicados mediante execute_sql. No se inventó una migración CLI: la CLI no estaba instalada. Consolidar la migración mediante db pull cuando la CLI esté disponible.

La sesión administrativa permanece en memoria y se pierde al recargar. La recuperación envía al callback exacto /auth/activar. La activación limpia el fragmento del historial y finaliza su sesión tras guardar contraseña. Google todavía no está habilitado.

## Validación

- TypeScript y compilación Next.js aprobados.
- Ocho pruebas de autorización y validación aprobadas, incluida la nueva acción update.
- tests/admin-edit-rollback.sql: actualización de importes y contacto, total mensual, historial, rechazo de versiones antiguas de fila y registros compartidos, correo inválido, actor no autorizado y ausencia de permisos públicos. Transacción revertida; conteos reales sin cambios y cero lotes de prueba persistidos.
- Las pruebas de navegador requieren Playwright y Chromium disponibles; en esta ejecución no había Chromium local. Verificación visual pública después de publicar; edición autenticada pendiente de comprobación con el titular.

## CRUD restante

Alta manual independiente, administración de nuevas cargas, cambio de relaciones y baja lógica recuperable pendientes. Rechazar una fila del Excel no equivale a eliminar un registro definitivo. Completar estos flujos antes de las fases 8–10, según seguimiento-proyecto.md.
