# Registro de propietarios e inquilinos

El home publica Login (acceso administrativo) y Registro. El registro captura rol declarado, nombre, correo, tipo/número de documento, teléfono y autorización para el uso de datos con esta finalidad.

Las solicitudes se guardan en `ki_registration_requests`, separadas de clientes y usuarios Auth. No asignan permisos, inmuebles ni cuentas privadas. La elección de rol es una declaración pendiente de validar. El administrador las consulta dentro del panel de importaciones, en Solicitudes de registro; el cruce y la vinculación todavía deben implementarse después de revisar identidad y relaciones.

La tabla usa RLS sin acceso para anon/authenticated. Solo la función de recepción puede insertar mediante RPC de service_role. Los duplicados exactos reciben el mismo resultado sin sobrescribir los datos anteriores ni revelar coincidencias. El listado exige Auth y autorización administrativa vigente. No se registran datos personales en logs ni código.

La paleta oficial es #9BCCEE y #3A4C5A, con Poppins y logo original. Se eliminaron los degradados saturados y se hizo visible el azul claro en el home. Blanco y tonos de apoyo se usan para lectura; verde/rojo solo para estados.
