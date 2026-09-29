# Propuesta de arquitectura: identidad y documentos privados
Fecha: 2026-09-29. Estado: recomendación para implementación; sin servicios externos creados ni autenticación real activada.

## Decisión recomendada
Usar PostgreSQL administrado por Supabase como base relacional, Supabase Auth para Google y correo/contraseña, y Supabase Storage para los PDF en un bucket privado. La base almacena personas, relaciones, contratos y metadatos; los archivos se almacenan como objetos, no dentro de las filas.

La robustez depende también de las autorizaciones, importaciones, copias y pruebas de restauración. Separar desarrollo y producción. Antes de contratar, revisar capacidad, coste, región, backups y necesidades de recuperación. No se ha seleccionado un plan ni contratado infraestructura.

## Identidad y alta de clientes
1. Kiosko registra o importa al propietario/inquilino y verifica su correo de contacto y documento.
2. Kiosko asigna las relaciones con inmuebles/contratos y los permisos de documentos.
3. El cliente recibe una invitación de activación con vencimiento y un solo uso. La aceptación exige una sesión con el correo verificado previsto en la invitación.
4. El cliente accede con Google o correo y contraseña. Las contraseñas las gestiona Supabase Auth; no se guardan en tablas del portal.
5. Solo una vinculación aprobada habilita la consulta de documentos. Una cuenta nueva sin vinculación queda pendiente y no ve información.

El acceso recomendado es Google o correo/contraseña. Supabase no ofrece cédula/contraseña como método nativo: su acceso con contraseña usa correo o teléfono. Si se requiere cédula como usuario, evaluar una capa adicional en servidor con recuperación, protección contra enumeración y límites de intentos; no exponer un directorio cédula-correo al navegador. No implementarla como autenticación propia improvisada.

La cédula identifica al cliente en el registro, pero conocerla no demuestra identidad ni da acceso. No asignar inmuebles automáticamente por una cédula digitada, nombre de Google o rol elegido en pantalla. Verificar un cambio de correo y una vinculación a otra cuenta. Los usuarios pueden tener ambos perfiles y múltiples inmuebles.

## Modelo de datos propuesto
| Entidad | Contenido y propósito |
| --- | --- |
| clientes | UUID interno, tipo/número de documento, nombre, contacto, estado |
| vinculaciones_cuentas | Usuario de Auth, cliente, aprobación, fecha y responsable de vinculación |
| inmuebles | UUID interno, código externo de Kiosko, dirección, estado |
| relaciones_propietarios | Cliente, inmueble, vigencia, participación y estado |
| contratos | Inmueble, referencia externa y vigencia |
| participantes_contrato | Clientes arrendatarios/coarrendatarios y alcance de acceso |
| documentos | UUID, tipo, periodo, inmueble/contrato opcionales, versión, origen, ruta privada, hash, estado de publicación |
| destinatarios_documento | Clientes autorizados expresamente para cada documento |
| importaciones | Origen, lote, errores, estado y responsable |
| eventos_auditoria | Actor, acción, documento/lote, fecha y resultado |

Un consolidado puede abarcar varios inmuebles, por lo que no se debe forzar una única relación inmueble-documento: agregar una tabla documentos_inmuebles cuando sea necesario. El vínculo de cliente con inmueble o contrato no implica automáticamente acceso a todo documento histórico; el destinatario autorizado se establece al publicar y se revoca expresamente cuando corresponda. Mantener políticas definidas para antiguos propietarios y contratos terminados.

Identificadores internos UUID; cédulas como texto, no enteros ni claves primarias. Restringir el registro de identificación a los procesos administrativos que lo necesiten. Importes en numeric con precisión definida o centavos enteros; nunca punto flotante. Índices para usuario-cliente, código externo, destinatario-documento y periodo. Claves foráneas y unicidad para evitar asociaciones ambiguas y duplicados.

## Consulta y descarga
Aplicar Row Level Security y privilegios mínimos en cada tabla expuesta. Una cuenta sin vínculo aprobado no puede consultar clientes, contratos, documentos ni objetos. Los usuarios finales son lectores y no pueden editar roles, destinatarios o aprobaciones.

Usar un bucket privado. El servidor valida la identidad y la autorización de cada documento; solo entonces devuelve el PDF autenticado o un enlace firmado de corta duración (propuesta inicial: 60 segundos). El enlace firmado puede compartirse mientras siga vigente: para revocación inmediata se prefiere descarga autenticada con comprobación en cada solicitud. Guardar rutas opacas por UUID, sin cédulas ni nombres en URLs.

Validar permisos también en Storage para impedir que se eluda la autorización descargando directamente. Para consultas y descargas preferir el contexto del usuario con RLS. Las claves administrativas se usan exclusivamente en procesos de servidor controlados; no se incluyen en frontend, repositorio o logs.

Registrar publicación, cambios de permisos y solicitudes de descarga. Un evento de solicitud o generación de enlace no demuestra que el usuario haya descargado o leído todo el PDF. Administradores con MFA, autorizaciones explícitas y registros de cambios; credenciales de Google solo en configuración segura del proveedor.

## Alimentación inicial
Primera etapa: carga administrativa de archivos y una importación validada de registros de clientes, inmuebles y contratos. Previsualizar errores y asociaciones antes de aplicar un lote. No enviar invitaciones automáticamente al importar sin una acción administrativa definida.

Para cada PDF, seleccionar tipo, periodo, destinatario e inmueble/contrato. Validar tamaño, firma/tipo PDF y contenido antes de publicar; poner nuevos archivos en cuarentena hasta su revisión. Publicación transaccional de metadatos y permisos, con compensación para objetos huérfanos. No sobrescribir documentos publicados: crear versiones.

Segunda etapa: importación masiva con identificadores externos y hashes para detectar duplicados, revisión de fallos y reintentos idempotentes.
Tercera etapa: integración autorizada con el sistema contable de Kiosko. Confirmar proveedor, documentación y permisos disponibles; no asumir API de SIMI por el nombre de una URL.

Los PDF originales serán la fuente inicial de consulta. Si el portal muestra saldos calculados, debe contar con movimientos normalizados y conciliados con el sistema contable; no inferirlos automáticamente de PDF sin controles.

## Operación y comprobaciones antes de producción
Copias de base y archivos por separado: el backup de PostgreSQL de Supabase no incluye el contenido de los objetos de Storage. Definir pérdida máxima aceptable y tiempo de recuperación, y comprobar una restauración de ambos componentes.

Verificar en integración: visitante sin sesión, cuenta pendiente, propietario A intentando leer documento de B, inquilino intentando acceder a estado de propietario, descarga directa por ruta conocida, enlace vencido, cliente desvinculado, contrato finalizado, permisos revocados, consolidado, recuperación de contraseña, ambos métodos de acceso y errores de importación.

Confirmar el origen del despliegue vigente antes de integrar esta rama. El borrador /borrador-cuentas continúa como demo pública con datos ficticios. No se ha desplegado esta arquitectura ni se han ejecutado migraciones.

## Configuración externa necesaria
Proyecto Supabase de Kiosko con entornos separados; proveedor Google OAuth con URLs autorizadas y permisos básicos de identidad; correo transaccional; método de gestión de secretos; responsables de carga/aprobación; fuente inicial de datos y política de conservación. No compartir contraseñas o secretos por chat.

## Fuentes oficiales consultadas
- Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Contraseñas: https://supabase.com/docs/guides/auth/passwords
- Seguridad de datos: https://supabase.com/docs/guides/database/secure-data
- Archivos privados: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Políticas de Storage: https://supabase.com/docs/guides/storage/security/access-control
- Backups: https://supabase.com/docs/guides/platform/backups
