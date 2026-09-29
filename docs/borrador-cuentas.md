# Borrador: acceso y documentos de propietarios e inquilinos

Ruta de revisión: `/borrador-cuentas` (requiere ejecutar o desplegar esta rama en un entorno de revisión).

## Referencia comprobada

El 29 de septiembre de 2026 se consultó SIMIDocs mediante el acceso autorizado por el usuario. El enlace suministrado corresponde a Acevedo y Cía., no a Kiosko. El acceso pide documento, clave y año. La vista de propietarios tiene filtros, estados consolidados y por inmueble, facturas electrónicas, facturas, notas crédito y certificados. El estado consolidado muestra periodos, inmuebles, descripción, descuentos, abonos y saldo, con conceptos de canon, seguros, comisión y giros.

Solo se conserva la estructura funcional; este repositorio no contiene datos de la cuenta consultada, documentos originales, credenciales ni enlaces privados. La vista de inquilinos es una propuesta y no una reproducción de una referencia comprobada.

## Alcance implementado

- Inicio de sesión visual con selección de perfil y año; campos de credenciales deshabilitados.
- Entrada explícita a una demostración con datos ficticios, sin persistencia de sesión.
- Filtros de inmueble y búsqueda de periodo; estado vacío cuando no hay coincidencias.
- Estado de cuenta de propietario individual y consolidado con descuentos, abonos, giros y saldo.
- Cuenta de cobro de inquilino con vencimiento de ejemplo, cargos, abonos y saldo.
- Secciones de facturas, notas crédito y certificados sin documentos simulados.
- Logo suministrado por el usuario, integrado como imagen en el borrador.

Los importes son ejemplos sin validez contable. Los resúmenes corresponden a un inmueble de ejemplo. Cambiar el año cambia el contexto, no consulta un archivo histórico real. No hay descarga PDF, procesamiento de pagos ni integración con SIMI.

## Pendientes para el acceso real

Antes de incorporar documentos reales, definir el proveedor de identidad y cómo se vincula cada cuenta con sus contratos/inmuebles. Implementar sesión en servidor, cookies seguras, recuperación de contraseña, límites de intentos y autorización por documento en cada lectura/descarga. El perfil no debe asignarse por una elección libre del cliente en el acceso real.

Confirmar el origen oficial de documentos de Kiosko y si SIMI ofrece una integración autorizada; el nombre `simidocsapi1.0` en una URL no demuestra que exista una API disponible para Kiosko. No reutilizar las credenciales ni las URLs de la inmobiliaria de referencia.

Identificar además el commit que produce el portal vigente: este borrador parte de `main` de GitHub y no resuelve la diferencia previamente observada entre esa rama y producción.

## Revisión pendiente

Se verificaron la sintaxis TSX, el archivo del logo, las clases CSS, el saldo final de ambos perfiles y los filtros básicos con los datos ficticios. No se ejecutó compilación completa ni QA visual: la clonación del repositorio falló por conexión de red en este entorno y no estaban disponibles sus dependencias instaladas.

Ejecutar el proyecto con sus dependencias bloqueadas y revisar ambos recorridos, búsqueda sin resultados, detalle individual/consolidado, cambio de año, salida y adaptación móvil. Esta rama no modifica la página principal ni ha sido publicada en el dominio de producción.
