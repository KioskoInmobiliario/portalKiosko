'use client';
import { useEffect } from 'react';

// Dashboard recovery emails use the Site URL by default. Keep the session
// fragment in the browser and forward it to the password setup page.
export default function AuthReturn() {
 useEffect(()=>{
  if (window.location.pathname !== '/') return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (['invite','recovery'].includes(params.get('type') || '') || params.has('error_code')) {
   window.location.replace('/auth/activar'+window.location.hash);
  }
 },[]);
 return null;
}
