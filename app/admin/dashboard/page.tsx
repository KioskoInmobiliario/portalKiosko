import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Home,
  LineChart,
  PhoneCall,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { getAdminDashboardData, type DashboardMetric } from '@/lib/admin-dashboard';
import styles from './dashboard.module.css';

const metricIcons: Record<DashboardMetric['id'], typeof UsersRound> = {
  leads: UsersRound,
  available_properties: Building2,
  appointments: CalendarDays,
  pending_payments: Banknote,
};

export const metadata = {
  title: 'Dashboard CRM | Portal Kiosko',
};

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();
  const updatedAt = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(dashboard.generatedAt));

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

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>CRM inmobiliario</p>
          <h1>Panel central para gestión comercial y operativa</h1>
          <p>Primera propuesta visual alineada con el manual de marca: inventario, prospectos, agenda, rendimiento y finanzas en una sola vista.</p>
        </div>
        <div className={styles.heroCard}>
          <LineChart />
          <strong>{dashboard.finance.value}</strong>
          <span>{dashboard.finance.description}</span>
        </div>
      </section>

      <section className={styles.dataStatus} aria-label="Estado de datos">
        <strong>{dashboard.source === 'seed' ? 'Datos semilla' : 'Datos conectados'}</strong>
        <span>Última actualización: {updatedAt}. Estructura lista para conectar base definitiva y permisos por perfil.</span>
      </section>

      <section className={styles.metrics} aria-label="Indicadores principales">
        {dashboard.metrics.map((metric) => {
          const Icon = metricIcons[metric.id];
          return <article key={metric.id}><Icon /><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.description}</small></article>;
        })}
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div><p className={styles.eyebrow}>Leads y pipeline</p><h2>Embudo comercial</h2></div>
            <PhoneCall />
          </div>
          <div className={styles.pipeline}>
            {dashboard.pipeline.map((item) => (
              <div key={item.id}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <i className={item.accent === 'sky' ? styles.sky : styles.slate} style={{ width: `${Math.max(item.value * 4, 22)}%` }} />
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div><p className={styles.eyebrow}>Propiedades</p><h2>Inventario por estado</h2></div>
            <Home />
          </div>
          <div className={styles.propertyList}>
            {dashboard.properties.map((property) => (
              <div key={property.id}>
                <span>{property.code}</span>
                <strong>{property.title}</strong>
                <small>{property.detail}</small>
                <em>{property.status}</em>
                <b>{property.value}</b>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div><p className={styles.eyebrow}>Calendario</p><h2>Próximas citas</h2></div>
            <CalendarDays />
          </div>
          <div className={styles.agenda}>
            {dashboard.agenda.map((event) => (
              <div key={event.id}>
                <time>{event.time}</time>
                <span><strong>{event.title}</strong><small>{event.detail}</small></span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div><p className={styles.eyebrow}>Equipo</p><h2>Rendimiento de agentes</h2></div>
            <ClipboardList />
          </div>
          <div className={styles.agents}>
            {dashboard.team.map((agent) => (
              <div key={agent.id}>
                <span><strong>{agent.name}</strong><small>{agent.metric}</small></span>
                <i><b style={{ width: `${agent.progress}%` }} /></i>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.nextStep}>
        <CheckCircle2 />
        <div>
          <h2>Estructura preparada</h2>
          <p>La vista ya consume un contrato de datos único. El siguiente paso será reemplazar los datos semilla por consultas reales y filtrar salidas para administrador, propietario e inquilino.</p>
        </div>
        <Link href="/admin/importaciones">Volver a importaciones <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}