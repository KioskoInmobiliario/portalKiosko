import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/admin-dashboard';
import DashboardBoard from './dashboard-board';
import styles from './dashboard.module.css';

export const metadata = {
  title: 'Dashboard CRM | Portal Kiosko',
};

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Volver al portal">
          <Image src="/kiosko-logo.png" alt="Kiosko Inmobiliario" width={1570} height={2048} className={styles.logo} priority />
        </Link>
        <nav className={styles.nav} aria-label="Administración">
          <Link href="/admin/importaciones">Importaciones</Link>
          <Link href="/admin/base">Base</Link>
          <Link href="/admin/dashboard" aria-current="page">Dashboard CRM</Link>
        </nav>
        <span className={styles.adminLabel}><ShieldCheck size={17} /> Borrador Fase 1</span>
      </header>
      <DashboardBoard initialData={dashboard} />
    </main>
  );
}