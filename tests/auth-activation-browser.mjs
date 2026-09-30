import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const runtimeRequire=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/package.json`:import.meta.url);
const {chromium}=runtimeRequire('playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let saves=0,logouts=0;
 await page.route('**/auth/v1/user',async r=>{
  assert.equal(r.request().headers().authorization,'Bearer synthetic-token');
  if(r.request().method()==='PUT') {
   saves++;assert.deepEqual(r.request().postDataJSON(),{password:'synthetic-password'});
  }
  return r.fulfill({json:{id:'synthetic-user',email:'admin@example.invalid',email_confirmed_at:'2026-09-30T00:00:00Z'}});
 });
 await page.route('**/auth/v1/logout',r=>{logouts++;return r.fulfill({status:204});});
 await page.goto('http://localhost:3000/auth/activar#type=invite&access_token=synthetic-token',{waitUntil:'networkidle'});
 await page.getByText('Cuenta confirmada: admin@example.invalid').waitFor();
 assert.equal(new URL(page.url()).hash,'');
 await page.getByLabel('Nueva contraseña',{exact:true}).fill('synthetic-password');
 await page.getByLabel('Confirmar contraseña').fill('different-password');
 await page.getByRole('button',{name:'Guardar contraseña'}).click();
 await page.getByRole('alert').filter({hasText:'Las contraseñas no coinciden.'}).waitFor();
 assert.equal(saves,0);
 await page.getByLabel('Confirmar contraseña').fill('synthetic-password');
 await page.getByRole('button',{name:'Guardar contraseña'}).click();
 await page.getByRole('heading',{name:'Contraseña guardada'}).waitFor();
 await page.waitForLoadState('networkidle');
 assert.equal(saves,1);assert.equal(logouts,1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 await page.goto('http://localhost:3000/auth/activar',{waitUntil:'networkidle'});
 await page.getByRole('alert').waitFor();
 assert.equal(await page.getByRole('button',{name:'Guardar contraseña'}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('Activación: validación, limpieza del enlace, contraseña, cierre de sesión y móvil comprobados con datos sintéticos.');
} finally {await browser.close();}
