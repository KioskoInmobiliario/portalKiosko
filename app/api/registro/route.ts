import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '@/lib/kiosko-config';
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origen no permitido'},{status:403});
 if(Number(request.headers.get('content-length')||0)>4096)return Response.json({error:'Solicitud demasiado grande'},{status:413});
 const text=await request.text();if(new TextEncoder().encode(text).length>4096)return Response.json({error:'Solicitud demasiado grande'},{status:413});
 try{const res=await fetch(`${SUPABASE_URL}/functions/v1/kiosko-registro`,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:text,signal:AbortSignal.timeout(20000),cache:'no-store'});return new Response(await res.text(),{status:res.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}catch{return Response.json({error:'No fue posible conectar. Intenta de nuevo más tarde.'},{status:503})}
}
