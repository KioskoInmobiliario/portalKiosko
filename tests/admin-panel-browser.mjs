import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const runtimeRequire = createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/package.json` : import.meta.url);
const { chromium } = runtimeRequire('playwright');
await mkdir('test-results',{recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const fixture={batches:[{id:'batch-test',source_filename:'Ejemplo de revisión.xlsx'}],clients:[],contracts:[],audit:[],rows:[{
 id:'00000000-0000-4000-8000-000000000001',batch_id:'batch-test',source_row:2,sheet_name:'Hoja de ejemplo',status:'pending',version:0,
 original_values:{values:{'Contrato #':'EJEMPLO-01','Direccion':'Calle de ejemplo 10','Nombre Propietario':'Propietario de ejemplo'}},
 normalized_values:{contract:{external_reference:'EJEMPLO-01',rent:'1500000',administration:'250000',starts_on:'2026-09-01'},property:{address:'Calle de ejemplo 10',building_name:'Edificio de ejemplo',unit_label:'301',area_m2:'60',bedrooms:2,bathrooms:2},owner:{full_name:'Propietario de ejemplo'},tenant:{full_name:'Inquilino de ejemplo',email:'persona@example.invalid',phone:'3001234567'}},
 validation_errors:[{code:'owner_identity_and_contact_not_supplied',field:'owner'}],reviewed_values:null
}]};
let mutations=0;
await page.route('**/auth/v1/token?grant_type=password',r=>r.fulfill({json:{access_token:'test-token'}}));
await page.route('**/api/admin/imports',async r=>{
 const body=r.request().postDataJSON();
 if(body.action==='list')return r.fulfill({json:fixture});
 mutations++; fixture.rows[0].reviewed_values=body.values;fixture.rows[0].version++;
 if(body.action==='apply')fixture.rows[0].status='applied';
 return r.fulfill({json:{status:fixture.rows[0].status}});
});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:3000/admin/importaciones',{waitUntil:'networkidle'});
await page.getByRole('heading',{name:'Revisión de importaciones'}).waitFor();
assert.equal(await page.getByText('Calle de ejemplo 10').count(),0);
await page.getByLabel('Correo administrativo').fill('admin@example.invalid');
await page.getByLabel('Contraseña',{exact:true}).fill('synthetic-password');
await page.getByRole('button',{name:'Ingresar al panel'}).click();
await page.getByRole('button',{name:'Fila 2'}).click();
await page.getByLabel('Código único de inmueble').fill('EJEMPLO-P01');
await page.getByLabel('Nota de revisión (obligatoria)').fill('Revisados los valores del ejemplo; identidad pendiente.');
await page.getByRole('checkbox',{name:/Entiendo que la incorporación/}).check();
await page.screenshot({path:'test-results/admin-desktop.png',fullPage:true});
await page.getByRole('button',{name:'Guardar correcciones'}).click();
await page.getByText('Correcciones guardadas.',{exact:true}).waitFor();
assert.equal(mutations,1);
await page.getByRole('button',{name:'Aprobar e incorporar'}).click();
assert.equal(mutations,1,'confirmation must precede write');
await page.getByRole('button',{name:'Confirmar incorporación',exact:true}).click();
await page.getByText('Fila incorporada. Las identidades y las cuentas siguen pendientes.',{exact:true}).waitFor();
assert.equal(mutations,2);
assert.equal(await page.getByRole('button',{name:'Aprobar e incorporar'}).count(),0);
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'test-results/admin-mobile.png',fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
assert.deepEqual(errors,[]);
console.log('UI: login, revisión, guardado, confirmación, incorporación y vista móvil verificados con datos sintéticos.');
await browser.close();
