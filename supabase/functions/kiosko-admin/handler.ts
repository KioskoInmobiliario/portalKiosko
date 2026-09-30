export interface Runtime { url: string; publicKey: string; secretKey: string; fetch: typeof fetch }
const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function handleAdmin(request: Request, runtime: Runtime): Promise<Response> {
 if (request.method !== 'POST') return reply(405, { error: 'Método no permitido' });
 const authorization = request.headers.get('Authorization');
 if (!authorization?.match(/^Bearer [^\s]+$/)) return reply(401, { error: 'Inicie sesión para continuar' });
 try {
  const auth = await runtime.fetch(`${runtime.url}/auth/v1/user`, { headers: { apikey: runtime.publicKey, Authorization: authorization } });
  if (!auth.ok) return reply(401, { error: 'Sesión vencida o inválida' });
  const user = await auth.json();
  if (!user.id || user.is_anonymous) return reply(403, { error: 'Acceso administrativo requerido' });
  if (Number(request.headers.get('Content-Length') || 0) > 65536) return reply(413, { error: 'Solicitud demasiado grande' });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 65536) return reply(413, { error: 'Solicitud demasiado grande' });
  const body = JSON.parse(raw);
  let name: string; let parameters: Record<string, unknown>;
  if (body.action === 'list') { name = 'ki_admin_edit_list'; parameters = { p_actor: user.id }; }
  else if (body.action === 'update' && typeof body.row_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.row_id) && Number.isInteger(body.version) && body.values && typeof body.values === 'object' && !Array.isArray(body.values) && body.entity_versions && typeof body.entity_versions === 'object' && !Array.isArray(body.entity_versions)) {
   name = 'ki_admin_update';
   parameters = {p_actor:user.id,p_row:body.row_id,p_version:body.version,p_values:body.values,p_revisions:body.entity_versions};
  }
  else if (['save', 'reject', 'apply'].includes(body.action) && typeof body.row_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.row_id) && Number.isInteger(body.version) && body.values && typeof body.values === 'object' && !Array.isArray(body.values)) {
   name = 'ki_admin_review';
   parameters = { p_actor: user.id, p_row: body.row_id, p_version: body.version, p_action: body.action, p_values: body.values };
  } else return reply(400, { error: 'Solicitud inválida' });
  const result = await runtime.fetch(`${runtime.url}/rest/v1/rpc/${name}`, {
   method: 'POST', headers: { apikey: runtime.secretKey, ...(!runtime.secretKey.startsWith('sb_secret_') ? { Authorization: `Bearer ${runtime.secretKey}` } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(parameters)
  });
  const data = await result.json();
  if (!result.ok) {
   const status = data.code === '42501' ? 403 : data.code === '40001' || data.code === '23505' ? 409 : data.code?.startsWith('22') || data.code?.startsWith('23') ? 422 : 500;
   return reply(status, { error: status === 500 ? 'No fue posible completar la operación' : data.message, code: data.code });
  }
  return reply(200, data);
 } catch { return reply(400, { error: 'No fue posible procesar la solicitud' }); }
}
