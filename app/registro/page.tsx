import Link from 'next/link';
import Image from 'next/image';
import RegistrationForm from './form';
export const metadata = {title:'Registro | Portal Kiosko'};
export default function RegistrationPage(){return <main className="registration-page"><header className="site-header"><Link href="/" aria-label="Volver al portal"><Image src="/kiosko-logo.png" alt="Kiosko Inmobiliario" width={1356} height={1800} className="brand-logo" priority/></Link><Link href="/admin/importaciones" className="access-login">Login</Link></header><section className="registration-card"><span className="eyebrow">Portal Kiosko</span><h1>Registro de usuarios</h1><p>Déjanos tus datos para revisar tu vinculación con los inmuebles administrados por Kiosko.</p><RegistrationForm/><p><Link href="/">← Volver al portal</Link></p></section></main>}
