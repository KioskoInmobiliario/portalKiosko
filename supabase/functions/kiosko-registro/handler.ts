export interface RegistrationRuntime {url:string;publicKey:string;secretKey:string;fetch:typeof fetch}
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function handleRegistration(request:Request,runtime:RegistrationRuntime){
 if(request.method!=='POST')return reply(405,{error:'Método no permitido'});
 // Public intake uses an API key; it never reads customer records or creates access.
 if(request.headers.get('apikey')!==runtime.publicKey)return reply(401,{error:'Solicitud no autorizada'});
 if(Number(request.headers.get('Content-Length')||0)>4096)return reply(413,{error:'Solicitud demasiado grande'});
 try{
 const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return reply(413,{error:'Solicitud demasiado grande'});
 const b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))return reply(422,{error:'Datos inválidos'});
 if(b.website)return reply(200,{received:true});
 const value=(k:string)=>typeof b[k]==='string'?b[k].trim():'';
 const values={role:value('role'),full_name:value('full_name'),email:value('email').toLowerCase(),document_type:value('document_type'),document_number:value('document_number').toUpperCase(),phone:value('phone'),consent:b.consent===true};
 if(!['propietario','inquilino'].includes(values.role)||values.full_name.length<3||values.full_name.length>150||values.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)||!['CC','CE','PAS','NIT','PPT'].includes(values.document_type)||! /^[A-Z0-9.-]{4,30}$/.test(values.document_number)||! /^[+0-9() .-]{7,25}$/.test(values.phone)||values.phone.replace(/\D/g,'').length<7||!values.consent)return reply(422,{error:'Revisa el nombre, correo, documento, teléfono y autorización.'});
 const res=await runtime.fetch(`${runtime.url}/rest/v1/rpc/ki_registration_submit`,{method:'POST',headers:{apikey:runtime.secretKey,...(!runtime.secretKey.startsWith('sb_secret_')?{Authorization:`Bearer ${runtime.secretKey}`} :{}),'Content-Type':'application/json'},body:JSON.stringify({p_values:values})});
 if(!res.ok)return reply(res.status===429?429:503,{error:'No fue posible enviar el registro. Intenta de nuevo más tarde.'});
 return reply(200,{received:true});
 }catch{return reply(400,{error:'No fue posible procesar la solicitud'})}
}
