import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { getAdminBaseData } from '@/lib/admin-base';
import BaseBoard from './base-board';
import styles from './base.module.css';

export const metadata = {
  title: 'Base administrativa | Portal Kiosko',
};

export default function AdminBasePage() {
  const data = getAdminBaseData();

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Volver al portal">
          <Image src="/kiosko-logo.png" alt="Kiosko Inmobiliario" width={1570} height={2048} className={styles.logo} priority />
        </Link>
        <nav className={styles.nav} aria-label="Administración">
          <Link href="/admin/importaciones">Importaciones</Link>
          <Link href="/admin/base" aria-current="page">Base</Link>
          <Link href="/admin/dashboard">Dashboard CRM</Link>
        </nav>
        <span className={styles.adminLabel}><ShieldCheck size={17} /> Administración</span>
      </header>
      <BaseBoard initialData={data} />
    </main>
  );
}