# Supabase: esquema aplicado y Excel cargado

Estado al 30 de septiembre de 2026: esquema aplicado al proyecto Kiosko y 93 filas cargadas en un lote de revisión. La autenticación del portal y la consulta de PDF todavía no están implementadas.

## Proyecto e historial

- Proyecto: KioskoInmobiliario's Project (`samqjwhcaksorgvsyssv`).
- Rama de GitHub: `borrador/estados-cuenta-propietarios-inquilinos`.
- Migración remota `20260930011448 — kiosko_core`: SQL de `supabase/migrations/20260930000100_kiosko_core.sql`. El identificador del historial remoto difiere del nombre del archivo preparado.
- Migración remota `20260930012134 — kiosko_foreign_key_indexes`: seis índices de relaciones, cuyo SQL se conserva al final de este documento.
- No se han desplegado cambios en la web ni guardado secretos en GitHub.

## Fuente y carga

Fuente: Base Kiosko Inmobiliario.xlsx. El titular aclaró el 30 de septiembre de 2026 que los datos son reales y los está actualizando. Se corrige la descripción inicial de datos ficticios.
SHA-256: `5ec22f679025318aa7dd144c6758bdd5b0de22002dab9f1716ea1eda4cb4a948`.

Hoja 1: 17 columnas de negocio y 93 registros, filas 2–94. Se excluyeron filas vacías y el bloque auxiliar de aumentos de las filas 926–930.

Lote: `17a55243-5aac-494f-9f98-b3fa9ab2e586`, estado `staged`.
Las 93 filas se encuentran en `ki_import_rows`, con estado `pending` e identidad `unverified`. Cada fila conserva sus valores originales, fórmulas y valores cacheados, una propuesta normalizada y las observaciones de validación. Las fórmulas se validaron únicamente para expresiones de suma admitidas, sin ejecutar fórmulas arbitrarias.

La carga usa el hash del archivo para reutilizar el lote y la restricción única lote/hoja/fila para evitar duplicarlo en una repetición. Los datos originales y contactos no se publicaron en este repositorio.

## Resultado de revisión

| Observación | Filas afectadas |
| --- | ---: |
| Propietarios sin documento ni datos de contacto suministrados | 93 |
| Referencia de contrato repetida | 24, en 11 grupos |
| Falta referencia de contrato | 1 |
| Falta nombre de inquilino | 3 |
| Falta fecha de inicio o es inválida | 2 |
| Falta teléfono de inquilino | 22 |
| Teléfono con formato inválido | 4 |
| Falta correo de inquilino | 22 |
| Correo con formato inválido | 2 |
| Falta área | 2 |
| Unidad de área ambigua | 1 |
| Fecha en campo de parqueadero | 2 |
| Falta total validable | 1 |

Las observaciones pueden coincidir en una misma fila. Las referencias repetidas pueden corresponder a errores o contratos con varios inmuebles: se conservaron todas. Los nombres no prueban identidad; no se fusionaron propietarios ni se vincularon cuentas automáticamente.

## Mapeo para las entidades definitivas

| Excel | Destino |
| --- | --- |
| Contrato # | ki_contracts.external_reference, texto |
| Admin | ki_contracts.administration, confirmar que representa cuota de administración |
| Canon | ki_contracts.rent |
| Total | Control contra canon + administración |
| Inicio | ki_contracts.starts_on |
| Direccion | ki_properties.address |
| Nombre Edificio | ki_properties.building_name |
| Apto | ki_properties.unit_label, texto |
| Nombre Inquilino | ki_clients.full_name + ki_contract_participants |
| Nombre Propietario | ki_clients.full_name + ki_property_owners |
| Area | ki_properties.area_m2 tras validar unidades |
| Hab / Bañ | ki_properties.bedrooms / bathrooms |
| Parq | ki_properties.parking_reference, referencia y no cantidad |
| Seguro | ki_contracts.insurance_provider |
| Celular Inquilino / Correo Inquilino | ki_clients.phone / email |

## Protección y verificación

Se verificaron las nueve tablas, RLS habilitado y ausencia de permisos SELECT/INSERT/UPDATE/DELETE para `anon` y `authenticated`. El rol de servidor administrativo puede operar la base; sus claves nunca deben enviarse al navegador.

Resultados de consulta: 1 lote, 93 filas pendientes y sin verificar, 0 clientes definitivos, 0 inmuebles definitivos, 0 contratos definitivos y 0 vínculos de cuenta. La revisión aún debe aprobar correspondencias, identificar personas y asignar códigos estables a inmuebles antes de poblar las entidades definitivas.

El asesor de seguridad solo reporta nueve avisos informativos de RLS sin políticas: el cierre de acceso es intencional hasta implementar autorización por propietario/inquilino. La revisión de rendimiento detectó seis claves foráneas sin índice; se corrigieron y verificaron. Solo quedan avisos informativos de índices todavía sin uso, esperables en tablas nuevas.

## Siguiente implementación

1. Panel administrativo autorizado en servidor para revisar y aprobar filas.
2. Aplicación transaccional de registros aprobados a clientes, inmuebles y contratos.
3. Supabase Auth, configuración Google y validación de identidad antes de vincular cuentas.
4. PDF privados con destinatarios y pruebas de aislamiento de acceso.
5. Integración del portal y configuración segura de despliegue.

Conectar el plugin permite administrar Supabase; la web requiere código y configuración propios para consultar los datos. El inicio de sesión no está activado por esta carga.

## SQL adicional aplicado: kiosko_foreign_key_indexes

```sql
create index if not exists ki_account_links_approved_by_idx on public.ki_account_links (approved_by);
create index if not exists ki_account_links_client_id_idx on public.ki_account_links (client_id);
create index if not exists ki_contract_participants_client_id_idx on public.ki_contract_participants (client_id);
create index if not exists ki_contract_properties_property_id_idx on public.ki_contract_properties (property_id);
create index if not exists ki_import_batches_created_by_idx on public.ki_import_batches (created_by);
create index if not exists ki_property_owners_client_id_idx on public.ki_property_owners (client_id);
```

Referencias:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control

## Estado actualizado — 30 de septiembre de 2026

Consulta posterior a la revisión del titular: 1 fila incorporada y 92 pendientes; 1 inmueble, 1 contrato y 2 personas. Los conteos anteriores documentan la carga inicial. La edición posterior actualiza los registros existentes y conserva su historial.
