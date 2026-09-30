import {handleRegistration} from './handler.ts';
Deno.serve((request:Request)=>handleRegistration(request,{
 url:Deno.env.get('SUPABASE_URL')!,
 publicKey:JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY')!,
 secretKey:JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,fetch,
}));
