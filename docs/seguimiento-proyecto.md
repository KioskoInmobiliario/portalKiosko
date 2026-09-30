# Seguimiento del Portal Kiosko

Decisiones confirmadas por el titular el 30 de septiembre de 2026.

## Acuerdos vigentes

- Diseño bajo el manual oficial: azul claro #9BCCEE, gris azulado #3A4C5A, Poppins Regular y Bold, logo suministrado sin deformarlo.
- Infraestructura aprobada: GitHub, Vercel y Supabase; dominio administrado en Latinoamérica Hosting. Sin dependencia de Sites.
- Conservar la rama `borrador/estados-cuenta-propietarios-inquilinos` hasta definir y terminar el proyecto. No integrar todavía en main.
- Los datos del Excel son reales y el titular los está actualizando. No publicar datos del archivo ni documentos de clientes en GitHub.
- El titular confirmó que pudo iniciar sesión en el panel administrativo.
- Completar las fases anteriores antes de avanzar a portales privados, documentos y estados de cuenta.

## Fases y criterios de cierre

| Fase | Estado | Criterio de cierre pendiente |
|---|---|---|
| 1. Alcance y diseño | Alcance definido; marca oficial incorporada | Revisión visual de las pantallas con el titular |
| 2. Infraestructura | Aprobada y conectada | Sin decisión pendiente |
| 3. GitHub | Rama de trabajo vigente | Integración a main al terminar el proyecto |
| 4. Base unificada | 93 filas; 1 incorporada y 92 pendientes al revisar | Completar correcciones y correspondencias del Excel real |
| 5. Panel administrativo | Revisión y edición posterior a incorporación | Comprobar una actualización con el titular y completar el CRUD administrativo |
| 6. Publicación y dominio | Vercel y HTTPS verificados | Operación continua |
| 7. Autenticación administrativa | Correo confirmado, autorización activa y acceso confirmado por el titular | Google queda como alternativa futura, no habilitada |
| 8. Portales privados | Pendiente de implementación real | Iniciar después de cerrar las fases anteriores |
| 9. Estados y PDF | Existe un borrador visual; datos reales y descargas pendientes | Iniciar después de cerrar las fases anteriores |
| 10. Administración y operación | Pendiente | Completar relaciones, documentos y operación |

## CRUD antes de los portales privados

- Crear: actualmente mediante incorporación aprobada de filas. Falta alta manual independiente y carga de nuevos lotes desde la interfaz.
- Consultar: listado, búsqueda, filtros y detalle del lote.
- Actualizar: correcciones antes de incorporar y edición del inmueble, contrato y personas después de incorporar.
- Eliminar: pendiente de definir e implementar baja lógica recuperable con historial. El rechazo de una fila de importación no equivale a eliminar un registro definitivo.
- Cambiar relaciones (otro propietario, inquilino o contrato): flujo independiente pendiente. La edición actual conserva los IDs vinculados.

## Edición de registros incorporados

Seleccionar filtro Incorporada, abrir una fila y usar Editar registros incorporados. Cambiar los valores, escribir motivo y Guardar actualización; confirmar antes de aplicar. Mantiene los registros existentes, el archivo original y el estado incorporado. Las modificaciones en personas o contratos compartidos se reflejan en otras relaciones. Cada registro tiene una revisión para impedir sobrescribir cambios simultáneos.

Los ensayos de base de datos usan exclusivamente registros sintéticos en una transacción revertida. No modifican el registro real incorporado por el titular.

## Ajuste del home y registro (30 septiembre de 2026)

Se revisó la paleta oficial y se eliminaron degradados azules heredados. El home incorpora Login administrativo y Registro. Las solicitudes recogen los datos indicados por el usuario y quedan en Supabase pendientes de revisión. El panel permite consultar y buscar estas solicitudes. El cruce con clientes/inmuebles, validación de identidad y activación de cuentas queda pendiente; no se hacen asociaciones automáticas por documento o rol declarado. La rama de borrador sigue vigente.

Verificación: build y TypeScript correctos, 13 pruebas de aplicación y pruebas SQL con rollback (duplicados, autorización, privacidad y lectura administrativa).
