'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Search, ShieldCheck, FileSpreadsheet, LogOut, AlertTriangle, Save, X, ChevronRight } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/kiosko-config';
import { draftFor, validateDraft, issueLabels, money, type Draft, type ReviewData, type ImportRow } from '@/lib/import-review';
import styles from './panel.module.css';

const statusLabels: Record<string,string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', applied: 'Incorporada' };
export default function AdminPanel() {
 const [token,setToken] = useState('');
 const [data,setData] = useState<ReviewData | null>(null);
 const [selected,setSelected] = useState<ImportRow | null>(null);
 const [draft,setDraft] = useState<Draft>({});
 const [query,setQuery] = useState(''); const [filter,setFilter] = useState('pending'); const [batch,setBatch] = useState('');
 const [busy,setBusy] = useState(false); const [notice,setNotice] = useState(''); const [errors,setErrors] = useState<string[]>([]);
 const [confirm,setConfirm] = useState(false); const [onlyIssues,setOnlyIssues] = useState(false);
 const [authEmail,setAuthEmail] = useState(''); const [password,setPassword] = useState('');
 const [recovering,setRecovering] = useState(false);
 async function recoverPassword(e: React.FormEvent) {
  e.preventDefault(); if (busy) return; setBusy(true); setErrors([]); setNotice('');
  try {
   const redirect = `${window.location.origin}/auth/activar`;
   const res = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`, {
    method:'POST', headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'}, body:JSON.stringify({email:authEmail.trim()})
   });
   if (!res.ok) throw new Error(res.status===429?'Espere unos minutos antes de solicitar otro enlace.':'No se pudo enviar la recuperación. Intente nuevamente más tarde.');
   setNotice('Si el correo está registrado, recibirá un enlace para configurar su contraseña. Revise también la carpeta de correo no deseado.');
  } catch(e) {setErrors([(e as Error).message]);} finally {setBusy(false);}
 }
 const request = async (access: string, body: unknown): Promise<ReviewData> => {
  const res = await fetch('/api/admin/imports', { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  const json = await res.json();
  if (!res.ok) {
   if (res.status === 401) { setToken(''); setData(null); setSelected(null); }
   throw new Error(json.error || json.message || 'No fue posible completar la operación.');
  }
  return json;
 };
 async function login(e: React.FormEvent) {
  e.preventDefault(); setBusy(true); setErrors([]); setNotice('');
  try {
   const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: authEmail, password }) });
   const json = await res.json(); setPassword('');
   if (!res.ok) throw new Error('No se pudo iniciar sesión. Verifique su correo y contraseña.');
   const loaded = await request(json.access_token,{action:'list'});
   setToken(json.access_token); setData(loaded); setBatch(loaded.batches[0]?.id || '');
  } catch(e) { setErrors([(e as Error).message]); } finally { setBusy(false); }
 }
 async function logout() {
  const access = token; setToken(''); setData(null); setSelected(null); setDraft({}); setErrors([]); setNotice('');
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method:'POST', headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${access}`} }).catch(()=>undefined);
 }
 async function refresh() {
  if (selected && JSON.stringify(draft)!==JSON.stringify(draftFor(selected)) && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos y actualizar?')) return;
  setBusy(true); setErrors([]);
  try { const updated = await request(token,{action:'list'}); setData(updated); if(selected) { const row=updated.rows.find(r=>r.id===selected.id); if(row){setSelected(row);setDraft(draftFor(row));} } }
  catch(e){setErrors([(e as Error).message]);} finally {setBusy(false);}
 }
 function choose(row: ImportRow) {
  if (selected && JSON.stringify(draft)!==JSON.stringify(draftFor(selected)) && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos y abrir otra fila?')) return;
  setSelected(row);setDraft(draftFor(row));setErrors([]);setNotice('');setConfirm(false);
 }
 const change = (key: string,value: string | boolean) => {setDraft(d=>({...d,[key]:value}));setConfirm(false);setNotice('');};
 async function action(kind: 'save' | 'reject' | 'apply') {
  if(!selected || busy) return;
  const validation = kind === 'apply' ? validateDraft(draft) : String(draft.review_note || '').trim() ? [] : ['Escriba una nota de revisión.'];
  if(kind==='apply' && selected.validation_errors.some(e=>e.code==='repeated_contract_reference') && !draft.duplicates_ack) validation.push('Confirme la revisión de la referencia repetida.');
  if(validation.length) {setErrors(validation);setConfirm(false);return;}
  if(kind==='apply' && !confirm) {setConfirm(true);setErrors([]);return;}
  setBusy(true);setErrors([]);setNotice('');
  try {
   await request(token,{action:kind,row_id:selected.id,version:selected.version,values:draft});
   const updated=await request(token,{action:'list'});setData(updated);
   const row=updated.rows.find(r=>r.id===selected.id);if(row){setSelected(row);setDraft(draftFor(row));}
   setNotice(kind==='apply'?'Fila incorporada. Las identidades y las cuentas siguen pendientes.':kind==='reject'?'Fila rechazada y conservada en el historial.':'Correcciones guardadas.');
   setConfirm(false);
  }catch(e){setErrors([(e as Error).message]);setConfirm(false);}finally{setBusy(false);}
 }
 const rows=data?.rows.filter(r=>(!batch||r.batch_id===batch)) || [];
 const visible=rows.filter(r=>(filter==='all'||r.status===filter)&&(!onlyIssues||r.validation_errors.length>0)&&JSON.stringify([r.source_row,r.normalized_values,r.reviewed_values]).toLowerCase().includes(query.toLowerCase()));
 const field = (key: string,label: string,type='text',disabled=false) => <label className={styles.field} key={key}><span>{label}</span><input type={type} value={String(draft[key]??'')} onChange={e=>change(key,e.target.value)} disabled={disabled||busy||selected?.status==='applied'} step={type==='number'?'0.01':undefined} /></label>;
 const person = (prefix: 'owner'|'tenant',label: string) => <fieldset className={styles.group}><legend>{label}</legend>
  <label className={styles.field}><span>Persona a incorporar</span><select disabled={busy||selected?.status==='applied'} value={String(draft[`${prefix}_id`]||'')} onChange={e=>{
   const c=data?.clients.find(c=>c.id===e.target.value);setDraft(d=>({...d,[`${prefix}_id`]:e.target.value,...(c?{[`${prefix}_name`]:c.full_name}:{})}));setConfirm(false);
  }}><option value="">Crear registro pendiente</option>{data?.clients.filter(c=>c.status!=='inactive').map(c=><option key={c.id} value={c.id}>{c.full_name} · {c.document_number||'Sin documento'} · {c.id.slice(0,8)}</option>)}</select></label>
  {field(`${prefix}_name`,'Nombre completo', 'text',!!draft[`${prefix}_id`])}
  {!draft[`${prefix}_id`]&&<div className={styles.fields}>{field(`${prefix}_document_type`,'Tipo de documento (opcional)')}{field(`${prefix}_document_number`,'Número de documento (opcional)')}{field(`${prefix}_email`,'Correo (opcional)','email')}{field(`${prefix}_phone`,'Teléfono (opcional)','tel')}</div>}
  <p className={styles.hint}>{draft[`${prefix}_id`]?'Se usará la persona seleccionada. Sus datos actuales se conservan.':'Sin documento, se crea una persona pendiente independiente. No se unirá a otra por su nombre.'}</p>
 </fieldset>;

 return <main className={styles.shell}>
  <header className={styles.header}><Link href="/" className={styles.brand}>KIOSKO<span>INMOBILIARIO</span></Link><div className={styles.adminLabel}><ShieldCheck size={17}/> Administración</div>{token&&<button onClick={logout} className={styles.light}><LogOut size={16}/> Salir</button>}</header>
  {!token ? <section className={styles.login}><div className={styles.icon}><ShieldCheck size={28}/></div><p className={styles.eyebrow}>ACCESO ADMINISTRATIVO</p><h1>Revisión de importaciones</h1><p>Ingrese con su cuenta autorizada para revisar los datos del Excel e incorporarlos al portal.</p>
   <form onSubmit={recovering?recoverPassword:login}><label className={styles.field}><span>Correo administrativo</span><input type="email" autoComplete="username" required disabled={busy} value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/></label>{!recovering&&<label className={styles.field}><span>Contraseña</span><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>}<button className={styles.primary} disabled={busy}>{recovering?(busy?'Enviando enlace…':'Enviar enlace de recuperación'):(busy?'Verificando acceso…':'Ingresar al panel')}<ChevronRight size={17}/></button></form>
   <button type="button" className={styles.back} disabled={busy} style={{background:'none',border:0,padding:0}} onClick={()=>{setRecovering(!recovering);setPassword('');setErrors([]);setNotice('');}}>{recovering?'Volver al inicio de sesión':'Recuperar contraseña'}</button>
   <div role="status">{notice&&<p className={styles.success}>{notice}</p>}</div>
   <div role="alert">{errors.map(e=><p className={styles.error} key={e}>{e}</p>)}</div><p className={styles.hint}>La cuenta debe estar registrada en Supabase Auth y autorizada como administradora. La sesión se cierra al recargar la página.</p><Link className={styles.back} href="/"><ArrowLeft size={15}/> Volver al portal</Link>
  </section> : <div className={styles.content}>
   <div className={styles.title}><div><p className={styles.eyebrow}>DATOS DEL PORTAL</p><h1>Revisión de importaciones</h1><p>Revise el origen, corrija los campos y apruebe cada incorporación.</p></div><button className={styles.light} disabled={busy} onClick={refresh}>Actualizar datos</button></div>
   <section className={styles.stats}>{[['Filas del lote',rows.length],['Pendientes',rows.filter(r=>r.status==='pending').length],['Incorporadas',rows.filter(r=>r.status==='applied').length],['Rechazadas',rows.filter(r=>r.status==='rejected').length]].map(([label,count])=><div key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</section>
   <div className={styles.toolbar}><label className={styles.search}><Search size={18}/><input aria-label="Buscar filas" placeholder="Buscar contrato, dirección o persona…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Lote" value={batch} onChange={e=>{setBatch(e.target.value);setSelected(null);}}>{data?.batches.map(b=><option key={b.id} value={b.id}>{b.source_filename}</option>)}</select><select aria-label="Estado" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><label className={styles.check}><input type="checkbox" checked={onlyIssues} onChange={e=>setOnlyIssues(e.target.checked)}/> Con observaciones</label></div>
   <div className={styles.workspace}><section className={styles.list}><div className={styles.listTitle}><FileSpreadsheet size={18}/><strong>{visible.length} filas</strong></div><div className={styles.tableWrap}><table><thead><tr><th>Fila / Contrato</th><th>Inmueble</th><th>Estado</th></tr></thead><tbody>{visible.map(r=><tr key={r.id} className={selected?.id===r.id?styles.selected:''}><td><button className={styles.rowButton} disabled={busy} onClick={()=>choose(r)}>Fila {r.source_row}<strong>{String(r.reviewed_values?.contract_reference||r.normalized_values.contract?.external_reference||'Sin referencia')}</strong></button></td><td>{String(r.reviewed_values?.address||r.normalized_values.property?.address||'Sin dirección')}<small>{r.validation_errors.length} observaciones de origen</small></td><td><span className={`${styles.badge} ${r.status==='applied'?styles.applied:r.status==='rejected'?styles.rejected:''}`}>{statusLabels[r.status]}</span></td></tr>)}</tbody></table>{!visible.length&&<p className={styles.empty}>No hay filas con estos filtros.</p>}</div></section>
   <section className={styles.detail}>{!selected ? <div className={styles.empty}><FileSpreadsheet size={36}/><h2>Seleccione una fila</h2><p>Compare los valores del Excel y registre su revisión antes de aprobar.</p></div> : <>
    <div className={styles.detailTitle}><div><p className={styles.eyebrow}>{selected.sheet_name} · FILA {selected.source_row}</p><h2>Revisar incorporación</h2></div><span className={styles.badge}>{statusLabels[selected.status]}</span></div>
    <div className={styles.observations}><strong><AlertTriangle size={15}/> Observaciones del archivo original</strong><ul>{selected.validation_errors.map((e,i)=><li key={i}>{issueLabels[e.code]||e.code}</li>)}</ul><p>Estos avisos se conservan como referencia. La aprobación valida los datos corregidos.</p></div>
    <details className={styles.original}><summary>Ver datos originales del Excel</summary><dl>{Object.entries(selected.original_values.values).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v==null?'—':String(v)}</dd></div>)}</dl></details>
    <fieldset className={styles.group}><legend>Contrato</legend><label className={styles.field}><span>Contrato a incorporar</span><select disabled={busy||selected.status==='applied'} value={String(draft.contract_id||'')} onChange={e=>{const c=data?.contracts.find(c=>c.id===e.target.value);setDraft(d=>({...d,contract_id:e.target.value,...(c?{contract_reference:c.external_reference,rent:String(c.rent),administration:String(c.administration),starts_on:c.starts_on,insurance_provider:c.insurance_provider||''}:{})}));setConfirm(false);}}><option value="">Crear contrato con referencia nueva</option>{data?.contracts.map(c=><option key={c.id} value={c.id}>{c.external_reference} · {c.id.slice(0,8)}</option>)}</select></label><div className={styles.fields}>{field('contract_reference','Referencia de contrato')}{field('starts_on','Fecha de inicio','date')}{field('rent','Canon mensual','number')}{field('administration','Cuota de administración','number')}{field('insurance_provider','Aseguradora')}</div><p className={styles.total}>Total mensual <strong>{money(Number(draft.rent||0)+Number(draft.administration||0))}</strong></p></fieldset>
    <fieldset className={styles.group}><legend>Inmueble</legend><div className={styles.fields}>{field('property_code','Código único de inmueble')}{field('address','Dirección')}{field('building_name','Edificio')}{field('unit_label','Unidad / apartamento')}{field('area_m2','Área en m²','number')}{field('bedrooms','Habitaciones','number')}{field('bathrooms','Baños','number')}{field('parking_reference','Referencia de parqueadero')}</div></fieldset>
    {person('owner','Propietario')}{person('tenant','Inquilino')}
    <fieldset className={styles.group}><legend>Decisión del administrador</legend><label className={styles.field}><span>Nota de revisión (obligatoria)</span><textarea disabled={busy||selected.status==='applied'} rows={3} value={String(draft.review_note||'')} onChange={e=>change('review_note',e.target.value)} placeholder="Explique correcciones, faltantes aceptados y decisiones sobre referencias repetidas."/></label><label className={styles.check}><input type="checkbox" disabled={busy||selected.status==='applied'} checked={draft.duplicates_ack===true} onChange={e=>change('duplicates_ack',e.target.checked)}/> Revisé las referencias repetidas; documenté si corresponde a otro contrato o a varios inmuebles del mismo contrato.</label><label className={styles.check}><input type="checkbox" disabled={busy||selected.status==='applied'} checked={draft.identity_pending_ack===true} onChange={e=>change('identity_pending_ack',e.target.checked)}/> Entiendo que la incorporación deja las identidades pendientes y no habilita cuentas ni publica documentos.</label></fieldset>
    <div aria-live="polite">{notice&&<p className={styles.success}><Check size={17}/>{notice}</p>}</div><div role="alert">{errors.length>0&&<ul className={styles.error}>{errors.map(e=><li key={e}>{e}</li>)}</ul>}</div>
    {selected.status!=='applied'&&<div className={styles.actions}><button disabled={busy} className={styles.light} onClick={()=>action('save')}><Save size={16}/>{selected.status==='rejected'?'Guardar y reabrir':'Guardar correcciones'}</button><button disabled={busy} className={styles.danger} onClick={()=>action('reject')}><X size={16}/>Rechazar fila</button><button disabled={busy} className={styles.primary} onClick={()=>action('apply')}><Check size={16}/>{busy?'Procesando…':'Aprobar e incorporar'}</button></div>}
    {confirm&&<div className={styles.confirm} role="alert"><strong>Confirmar incorporación de la fila {selected.source_row}</strong><p>Se crearán el inmueble y sus relaciones con las personas y el contrato elegidos. La fila quedará bloqueada para evitar una segunda carga.</p><button disabled={busy} className={styles.primary} onClick={()=>action('apply')}>Confirmar incorporación</button><button disabled={busy} className={styles.light} onClick={()=>setConfirm(false)}>Seguir revisando</button></div>}
    {selected.applied_entities&&<details className={styles.original}><summary>Registros incorporados</summary><dl>{Object.entries(selected.applied_entities).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details>}
    <details className={styles.original}><summary>Historial de esta fila</summary>{data?.audit.filter(a=>a.row_id===selected.id).map(a=><p key={a.id}>{new Date(a.created_at).toLocaleString('es-CO',{timeZone:'America/Bogota'})} · {a.action==='apply'?'Incorporación':a.action==='reject'?'Rechazo':'Correcciones'} · {String(a.submitted_values.review_note)}<small>Administrador: {a.actor_id}</small></p>)}</details>
   </>}</section></div>
  </div>}
 </main>;
}
