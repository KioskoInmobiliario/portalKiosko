'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
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
  UsersRound,
} from 'lucide-react';
import { deriveAdminDashboardData } from '@/lib/admin-derived-data';
import type { AdminDashboardData, DashboardMetric } from '@/lib/admin-dashboard';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/kiosko-config';
import styles from './dashboard.module.css';

const metricIcons: Record<DashboardMetric['id'], typeof UsersRound> = {
  leads: UsersRound,
  available_properties: Building2,
  appointments: CalendarDays,
  pending_payments: Banknote,
};

export default function DashboardBoard({ initialData }: { initialData: AdminDashboardData }) {
  const [dashboard, setDashboard] = useState(initialData);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const updatedAt = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(dashboard.generatedAt));

  async function connectApprovedData(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');
    try {
      let token = accessToken;
      if (!token) {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error('No se pudo iniciar sesión. Verifique el correo y la contraseña.');
        token = json.access_token;
        setAccessToken(token);
        setPassword('');
      }
      const response = await fetch('/api/admin/imports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
        cache: 'no-store',
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || json.message || 'No fue posible cargar las incorporaciones aprobadas.');
      setDashboard(deriveAdminDashboardData(json));
      setNotice('Dashboard actualizado con incorporaciones aprobadas.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
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

      <section className={styles.connection}>
        <div>
          <p className={styles.eyebrow}>Fuente de datos</p>
          <h2>Incorporaciones aprobadas</h2>
          <p>Conecta la sesión administrativa para recalcular el CRM con los datos reales incorporados desde Importaciones.</p>
        </div>
        <form onSubmit={connectApprovedData}>
          {!accessToken && (
            <>
              <input type="email" placeholder="Correo administrativo" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <input type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </>
          )}
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Actualizando...' : accessToken ? 'Actualizar CRM' : 'Conectar datos reales'}</button>
        </form>
        {notice && <p className={styles.success}>{notice}</p>}
        {error && <p className={styles.error}>{error}</p>}
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
          <p>La vista ya puede recalcularse desde las incorporaciones aprobadas. El siguiente paso será persistir edición CRUD directa y filtrar salidas para administrador, propietario e inquilino.</p>
        </div>
        <Link href="/admin/base">Ir a Base <ArrowRight size={16} /></Link>
      </section>
    </>
  );
}