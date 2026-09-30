import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/kiosko-config';
export async function POST(request: Request) {
 const token = request.headers.get('Authorization');
 if (!token?.match(/^Bearer [^\s]+$/)) return Response.json({ error: 'Inicie sesión' }, { status: 401 });
 const text = await request.text();
 if (new TextEncoder().encode(text).length > 65536) return Response.json({ error: 'Solicitud demasiado grande' }, { status: 413 });
 try {
  const result = await fetch(`${SUPABASE_URL}/functions/v1/kiosko-admin`, {
   method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: token, 'Content-Type': 'application/json' }, body: text,
   signal: AbortSignal.timeout(20000), cache: 'no-store',
  });
  return new Response(await result.text(), { status: result.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
 } catch { return Response.json({ error: 'No se pudo conectar. Intente nuevamente.' }, { status: 503 }); }
}
