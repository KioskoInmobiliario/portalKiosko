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
import styles from './dashboard.module.css';

const pipeline = [
  { label: 'Nuevo contacto', value: 18, accent: 'sky' },
  { label: 'Visita agendada', value: 9, accent: 'slate' },
  { label: 'Negociación', value: 6, accent: 'sky' },
  { label: 'Cierre pendiente', value: 4, accent: 'slate' },
];

const properties = [
  { code: 'CH-502', title: 'Apartamento Chicó', status: 'Disponible', value: '$3.800.000', detail: '92 m2 · 2 alcobas' },
  { code: 'CT-1204', title: 'Apartamento Cedritos', status: 'En negociación', value: '$2.900.000', detail: '78 m2 · 1 parqueadero' },
  { code: 'SB-301', title: 'Oficina Santa Bárbara', status: 'Arrendada', value: '$5.100.000', detail: '124 m2 · contrato activo' },
];

const agenda = [
  { time: '09:00', title: 'Llamada propietario', detail: 'Validar precio de captación' },
  { time: '11:30', title: 'Visita inmueble', detail: 'Cliente interesado en Cedritos' },
  { time: '15:00', title: 'Seguimiento cartera', detail: 'Cuenta de cobro pendiente' },
];

const agents = [
  { name: 'Comercial 1', metric: '8 visitas', progress: 76 },
  { name: 'Comercial 2', metric: '5 cierres', progress: 64 },
  { name: 'Operaciones', metric: '21 gestiones', progress: 88 },
];

export const metadata = {
  title: 'Dashboard CRM | Portal Kiosko',
};

export default function AdminDashboardPage() {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Volver al portal">
          <Image src="/kiosko-logo.png" alt="Kiosko Inmobiliario" width={1570} height={2048} className={styles.logo} priority />
        </Link>
        <nav className={styles.nav} aria-label="Administración">
          <Link href="/admin/importaciones">Importaciones</Link>
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
          <strong>$84.6M</strong>
          <span>Proyección mensual entre arriendos, administración y comisiones.</span>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Indicadores principales">
        <article><UsersRound /><span>Prospectos activos</span><strong>37</strong></article>
        <article><Building2 /><span>Inmuebles disponibles</span><strong>14</strong></article>
        <article><CalendarDays /><span>Citas esta semana</span><strong>11</strong></article>
        <article><Banknote /><span>Pagos pendientes</span><strong>8</strong></article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelTitle}>
            <div><p className={styles.eyebrow}>Leads y pipeline</p><h2>Embudo comercial</h2></div>
            <PhoneCall />
          </div>
          <div className={styles.pipeline}>
            {pipeline.map((item) => (
              <div key={item.label}>
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
            {properties.map((property) => (
              <div key={property.code}>
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
            {agenda.map((event) => (
              <div key={event.time}>
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
            {agents.map((agent) => (
              <div key={agent.name}>
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
          <h2>Siguiente revisión</h2>
          <p>Validar contigo si esta jerarquía de pantalla corresponde al flujo real de Kiosko antes de conectarla a datos vivos, permisos y reportes PDF.</p>
        </div>
        <Link href="/admin/importaciones">Volver a importaciones <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}
