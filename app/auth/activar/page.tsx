'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/kiosko-config';
import { activationFromHash, passwordError } from '@/lib/auth-activation';
import styles from '@/app/admin/importaciones/panel.module.css';

export default function ActivateAccount() {
 const activation = useRef<ReturnType<typeof activationFromHash> | null>(null);
 const [token,setToken] = useState(''); const [email,setEmail] = useState('');
 const [loading,setLoading] = useState(true); const [busy,setBusy] = useState(false);
 const [error,setError] = useState(''); const [done,setDone] = useState(false);
 const [password,setPassword] = useState(''); const [confirmation,setConfirmation] = useState('');
 useEffect(()=>{
  let mounted = true;
  if (!activation.current) {
   activation.current = activationFromHash(window.location.hash);
   // Tokens remain only in memory and are removed from browser history.
   window.history.replaceState({},'',window.location.pathname);
  }
  const session = activation.current;
  async function validate() {
   try {
    if(session.error) throw new Error(session.error);
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.token}`},cache:'no-store'});
    if(!response.ok) throw new Error('El enlace venció. Solicite una nueva invitación.');
    const user = await response.json();
    if(!user.id || !user.email_confirmed_at || user.is_anonymous) throw new Error('Primero confirme su correo mediante la invitación de Supabase.');
    if(mounted){setToken(session.token);setEmail(user.email || '');}
   }catch(e){if(mounted)setError((e as Error).message);}finally{if(mounted)setLoading(false);}
  }
  void validate();
  return ()=>{mounted=false;};
 },[]);
 async function submit(e: React.FormEvent) {
  e.preventDefault();if(busy || !token) return;
  const validation=passwordError(password,confirmation);if(validation){setError(validation);return;}
  setBusy(true);setError('');
  try {
   const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password})});
   if(!response.ok) throw new Error(response.status===401?'La sesión venció. Solicite un nuevo enlace.':'No se pudo guardar la contraseña. Revise los requisitos o solicite un nuevo enlace.');
   setPassword('');setConfirmation('');setDone(true);
   const session=token;setToken('');activation.current=null;
   await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session}`}}).catch(()=>undefined);
  }catch(e){setPassword('');setConfirmation('');setError((e as Error).message);}finally{setBusy(false);}
 }
 return <main className={styles.shell}><header className={styles.header}><Link href="/" className={styles.brand}>KIOSKO<span>INMOBILIARIO</span></Link></header>
  <section className={styles.login}><div className={styles.icon}><ShieldCheck size={28}/></div><p className={styles.eyebrow}>ACTIVACIÓN DE CUENTA</p><h1>{done?'Contraseña guardada':'Configure su contraseña'}</h1>
   {loading?<p>Verificando el enlace de activación…</p>:done?<><p>Ya puede iniciar sesión con su correo y la contraseña que eligió. El panel requiere además la autorización administrativa.</p><Link href="/admin/importaciones" className={styles.primary}>Ir al inicio de sesión</Link></>:token?<><p>Cuenta confirmada: {email}</p><form onSubmit={submit}><label className={styles.field}><span>Nueva contraseña</span><input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label className={styles.field}><span>Confirmar contraseña</span><input type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></label><p className={styles.hint}>Use al menos 12 caracteres. Su contraseña se envía directamente a Supabase.</p><button className={styles.primary} disabled={busy}>{busy?'Guardando…':'Guardar contraseña'}</button></form></>:<p>Abra el enlace de la invitación enviada a su correo.</p>}
   {error&&<p role="alert" className={styles.error}>{error}</p>}
  </section>
 </main>;
}
