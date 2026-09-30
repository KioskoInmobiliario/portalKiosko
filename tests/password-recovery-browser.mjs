import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/package.json`);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 let requests=0; const failures=[]; page.on('pageerror',e=>failures.push(e.message));
 await page.route('**/auth/v1/recover?*',r=>{
  requests++;
  assert.equal(new URL(r.request().url()).searchParams.get('redirect_to'),'http://localhost:3001/auth/activar');
  assert.deepEqual(r.request().postDataJSON(),{email:'admin@example.invalid'});
  return r.fulfill(requests===1?{json:{}}:{status:429,json:{msg:'rate limited'}});
 });
 await page.route('**/auth/v1/user',r=>r.fulfill({json:{id:'synthetic-user',email:'admin@example.invalid',email_confirmed_at:'2026-09-30T00:00:00Z'}}));
 await page.goto('http://localhost:3001/admin/importaciones');
 await page.getByRole('button',{name:'Recuperar contraseña',exact:true}).click();
 assert.equal(await page.getByLabel('Contraseña',{exact:true}).count(),0);
 await page.getByLabel('Correo administrativo').fill('admin@example.invalid');
 await page.getByRole('button',{name:'Enviar enlace de recuperación'}).click();
 await page.getByRole('status').filter({hasText:'Si el correo está registrado'}).waitFor();
 assert.equal(requests,1);
 await page.getByRole('button',{name:'Enviar enlace de recuperación'}).click();
 await page.getByText('Espere unos minutos antes de solicitar otro enlace.').waitFor();
 await page.getByRole('button',{name:'Volver al inicio de sesión'}).click();
 await page.getByLabel('Contraseña',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.goto('http://localhost:3001/#type=recovery&access_token=synthetic-token');
 await page.getByText('Cuenta confirmada: admin@example.invalid').waitFor();
 assert.equal(new URL(page.url()).pathname,'/auth/activar');
 assert.equal(new URL(page.url()).hash,'');
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 assert.deepEqual(failures,[]);
 console.log('Recuperación: envío, redirección, privacidad, límite de solicitudes, retorno al acceso y móvil comprobados.');
} finally {await browser.close();}
