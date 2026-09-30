# Preparación Supabase a partir del Excel
Estado: preparada en GitHub, no aplicada a un proyecto Supabase. No se ha activado el acceso real del portal ni subido información del libro.

## Fuente revisada
Base Kiosko Inmobiliario.xlsx, suministrado como datos ficticios. Hoja 1 tiene 17 columnas de negocio y 93 registros consecutivos (filas 2–94). Las filas 926–930 son un bloque auxiliar de aumentos y se excluyen de la importación de contratos. Las filas vacías no generan registros.

Hay 11 grupos de referencias de contrato repetidas (13 filas adicionales con una referencia ya utilizada). No se deben eliminar ni consolidar automáticamente: pueden corresponder a errores o a un contrato con varios inmuebles. Falta una referencia en la fila 13. Tres registros no tienen nombre de inquilino, dos no tienen fecha de inicio y 22 no tienen teléfono o correo de inquilino.

El archivo no aporta cédulas, correos o teléfonos de propietarios, ni código único independiente de inmueble. Los nombres no prueban identidad ni permiten una activación automática de cuentas.

## Mapeo propuesto
| Excel | Destino |
| --- | --- |
| Contrato # | ki_contracts.external_reference (texto) |
| Admin | ki_contracts.administration, sujeto a confirmar que es cuota de administración |
| Canon | ki_contracts.rent |
| Total | Control contra canon + administración; no confiar en fórmula sin evaluar |
| Inicio | ki_contracts.starts_on (fecha) |
| Direccion | ki_properties.address |
| Nombre Edificio | ki_properties.building_name |
| Apto | ki_properties.unit_label (texto) |
| Nombre Inquilino | ki_clients.full_name + ki_contract_participants |
| Nombre Propietario | ki_clients.full_name + ki_property_owners |
| Area | ki_properties.area_m2 tras validar unidades |
| Hab / Bañ | ki_properties.bedrooms / bathrooms |
| Parq | ki_properties.parking_reference, no cantidad |
| Seguro | ki_contracts.insurance_provider |
| Celular Inquilino | ki_clients.phone, texto normalizado |
| Correo Inquilino | ki_clients.email, recorte de espacios y revisión |

Parq contiene referencias numéricas, etiquetas con #, N/A y algunas fechas: estas últimas requieren revisión y no deben convertirse en identificadores de parqueadero automáticamente. Area mezcla números y texto m2; aparece una unidad ambigua (41m1) que debe revisarse. Los importes pueden incluir fórmulas: conservar su texto original y el resultado validado; no ejecutar fórmulas arbitrarias ni asumir que un valor cacheado es vigente.

## Importación
1. Registrar lote con hash SHA-256.
2. Llevar cada fila original y su ubicación a ki_import_rows, sin modificar las entidades finales.
3. Normalizar identificadores y contactos como texto, fechas e importes tipados.
4. Marcar duplicados, faltantes y ambigüedades por fila.
5. Aprobar correspondencias e identidades desde un panel administrativo.
6. Aplicar las filas aprobadas en una transacción e impedir la reaplicación accidental del lote.

Los primeros clientes pueden quedar pendientes sin documento; no se les vincula una cuenta hasta verificar identidad y contacto. No se agrupan propietarios solo porque coincidan sus nombres. Hace falta asignar códigos estables de inmueble y resolver referencias de contrato antes de publicar datos.

## Archivos preparados
- supabase/migrations/20260930000100_kiosko_core.sql: nueve tablas relacionales y staging, claves foráneas, restricciones e índices.
- supabase/.env.example: nombres de configuración, sin valores reales.

Todas las tablas comienzan con RLS activado y sin permisos para visitantes ni usuarios finales. No hay políticas de acceso habilitadas todavía. El rol administrativo de servidor puede operar la base; la interfaz cliente no puede administrar registros ni vincular identidades. Los permisos de documentos, Storage y las pruebas de aislamiento se incorporarán junto al módulo correspondiente.

## Conexión y próximos pasos
Instalar y conectar la integración Supabase en esta conversación. Seleccionar un proyecto de desarrollo perteneciente a Kiosko antes de aplicar migraciones. Revisar tablas existentes para evitar colisiones. Si no hay proyecto, definir organización, región y plan antes de crearlo; esta preparación no contrata ni crea infraestructura.

Después de conectar:
1. Aplicar y validar el esquema en desarrollo.
2. Implementar previsualización de importación y resolver los campos ambiguos.
3. Implementar el panel administrativo con autorización en servidor.
4. Configurar Auth, proveedor Google y correo transaccional.
5. Añadir PDF privados, destinatarios y pruebas de acceso/descarga.
6. Conectar el portal a los datos verificados.

Conectar el plugin da acceso para administrar Supabase, pero no conecta por sí solo la web en ejecución: el despliegue necesita configuración segura y código de integración. Ningún secreto se guarda en GitHub.

## Validación realizada
Revisión del libro sin modificaciones y controles estáticos de estructura SQL y configuración. No se ejecutó la migración: falta conexión a Supabase. No se ha importado el Excel, desplegado cambios ni probado autenticación real.

Fuentes:
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/storage/security/access-control
