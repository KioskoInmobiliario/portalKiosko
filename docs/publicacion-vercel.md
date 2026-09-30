# Publicación independiente en Vercel

## Preparación comprobada

Repositorio: `KioskoInmobiliario/portalKiosko`.
Rama de trabajo: `borrador/estados-cuenta-propietarios-inquilinos`.
Dominio indicado por el titular: `https://portal.kioskoinmobiliario.com/`.

La web compila con Next.js 16.2.6 y Node.js 24. `npm run build` crea el artefacto Next.js; `vercel.json` selecciona `nextjs` y `npm ci`. No se necesita una conexión de Sites para este despliegue. Supabase sigue alojando la base de datos, Auth y la Edge Function administrativa.

Se corrigieron accesos a propiedades opcionales en las tarjetas de la portada, manteniendo su comportamiento. El alcance de TypeScript corresponde ahora a los módulos de Next.js; los ejemplos D1, el Worker anterior y las Edge Functions Deno se comprueban en sus runtimes separados. La compilación, tipos, artefacto HTML y navegador administrativo se validaron localmente con datos sintéticos.

## Conexión y primer despliegue

1. Vincular Vercel con GitHub y permitir acceso al repositorio de Kiosko.
2. Identificar el equipo y cualquier proyecto existente antes de crear uno nuevo.
3. Importar o conectar el repositorio con raíz `.` y framework Next.js. La configuración del repositorio fija instalación y compilación.
4. Desplegar primero la rama de trabajo en una URL de vista previa y comprobar portada, login administrativo, activación y API sin sesión. No asumir que `main` contiene el panel.
5. Elegir explícitamente la rama y el commit de producción después de validar la vista previa.
6. Agregar `portal.kioskoinmobiliario.com` al proyecto. Usar el registro DNS exacto que indique Vercel para ese proyecto; no inventar una IP o CNAME. Cambiar únicamente el subdominio portal, preservando correo y dominio principal.
7. Comprobar despliegue de producción, asociación del dominio y HTTPS antes de modificar invitaciones.

No hace falta copiar la clave privilegiada de Supabase a Vercel. La API del portal usa la clave publishable y la sesión del usuario para llamar a la Edge Function, que obtiene sus secretos dentro de Supabase.

## Supabase Auth

Una vez disponible la URL final, configurar Site URL de producción y agregar como Redirect URL exacta `https://portal.kioskoinmobiliario.com/auth/activar`. La invitación debe especificar esa ruta como `redirectTo`; agregarla a la lista permitida no modifica automáticamente el destino del correo. No usar un comodín general para dominios de vista previa.

Reemitir el enlace correcto para `contacto@kioskoinmobiliario.com` únicamente después de la publicación y configuración. El enlace anterior se emitió con Site URL localhost. El titular confirma el correo y elige su contraseña personalmente. Después se puede habilitar su membresía en `ki_admins`, condicionada a una identidad confirmada, y verificar lectura del lote pendiente.

## Estado de acceso al proveedor

La instalación del plugin Vercel fue confirmada, pero sus herramientas no aparecieron disponibles en esta sesión. Todavía no se verificó la cuenta/equipo de Vercel, no se creó un proyecto remoto ni se modificó DNS o configuración de Auth. El próximo paso requiere herramientas de Vercel disponibles o autorización para continuar en su panel mediante navegador.

Referencias:
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/domains/working-with-domains/add-a-domain
