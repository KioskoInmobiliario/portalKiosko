import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDraft, draftFor } from '../lib/import-review.ts';
import { handleAdmin } from '../supabase/functions/kiosko-admin/handler.ts';
const valid = { contract_reference: 'TEST-1', starts_on:'2026-09-01', property_code:'TEST-P1', address:'Dirección de prueba', owner_name:'Persona A', tenant_name:'Persona B', rent:'1000.50', administration:'100', review_note:'Prueba',identity_pending_ack:true };
test('fecha imposible, importes negativos y contactos inválidos no se aprueban',()=>{
 assert.equal(validateDraft(valid).length,0);
 assert.ok(validateDraft({...valid,starts_on:'2026-02-30',rent:'-10',tenant_email:'correo inválido'}).length>=3);
 assert.ok(validateDraft({...valid,owner_document_type:'CC'}).length>0);
 assert.ok(validateDraft({...valid,identity_pending_ack:false}).length>0);
});
test('normalización no inventa código ni confirma identidades',()=>{
 const d=draftFor({normalized_values:{contract:{rent:'25'},property:{address:'A'},owner:{full_name:'B'},tenant:{full_name:'C'}},reviewed_values:null});
 assert.equal(d.property_code,'');assert.equal(d.owner_id,'');assert.equal(d.identity_pending_ack,false);
});
const request=(body,auth='Bearer verified-token')=>new Request('https://test/edge',{method:'POST',headers:auth?{Authorization:auth}:{},body:JSON.stringify(body)});
const runtime={url:'https://test',publicKey:'public',secretKey:'secret'};
test('sin token o con token inválido nunca se invoca una operación privilegiada',async()=>{
 let calls=0;
 const mock=async()=>{calls++;return Response.json({},{status:401});};
 assert.equal((await handleAdmin(request({action:'list'},''),{...runtime,fetch:mock})).status,401);
 assert.equal(calls,0);
 assert.equal((await handleAdmin(request({action:'list'}),{...runtime,fetch:mock})).status,401);
 assert.equal(calls,1);
});
test('actor proviene de Auth; actor y operaciones enviados por cliente se ignoran',async()=>{
 let parameters;
 const mock=async(url,init)=>{
  if(url.endsWith('/user'))return Response.json({id:'verified-user'});
  parameters=JSON.parse(init.body);return Response.json({rows:[]});
 };
 assert.equal((await handleAdmin(request({action:'list',p_actor:'attacker'}),{...runtime,fetch:mock})).status,200);
 assert.equal(parameters.p_actor,'verified-user');
 assert.equal((await handleAdmin(request({action:'delete'}),{...runtime,fetch:mock})).status,400);
});
test('rol revocado y versión antigua generan rechazo visible',async()=>{
 for(const [code,status] of [['42501',403],['40001',409]]){
  const mock=async(url)=>url.endsWith('/user')?Response.json({id:'verified-user'}):Response.json({code,message:'Rechazado'},{status:400});
  assert.equal((await handleAdmin(request({action:'list'}),{...runtime,fetch:mock})).status,status);
 }
});
test('edición usa el actor autenticado y exige versiones de los registros vinculados',async()=>{
 let parameters, endpoint;
 const mock=async(url,init)=>{
  if(url.endsWith('/user'))return Response.json({id:'verified-user'});
  endpoint=url;parameters=JSON.parse(init.body);return Response.json({status:'applied'});
 };
 const body={action:'update',row_id:'00000000-0000-4000-8000-000000000001',version:1,values:valid,entity_versions:{property:0,contract:0,owner:0,tenant:0},p_actor:'attacker'};
 assert.equal((await handleAdmin(request(body),{...runtime,fetch:mock})).status,200);
 assert.ok(endpoint.endsWith('/ki_admin_update'));
 assert.equal(parameters.p_actor,'verified-user');
 assert.deepEqual(parameters.p_revisions,body.entity_versions);
 assert.equal((await handleAdmin(request({...body,entity_versions:null}),{...runtime,fetch:mock})).status,400);
});
