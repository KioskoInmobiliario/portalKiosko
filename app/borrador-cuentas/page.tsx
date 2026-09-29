"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./cuentas.module.css";
import { logo } from "./logo";

type Profile = "propietario" | "inquilino";
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
const periods = ["Septiembre", "Agosto", "Julio"];
const properties = ["Inmueble de ejemplo A", "Inmueble de ejemplo B"];
const ownerRows = [
  { concept: "Canon de arrendamiento", debit: 0, credit: 2000000 },
  { concept: "Comisión de administración (ejemplo)", debit: 160000, credit: 0 },
  { concept: "IVA sobre comisión (ejemplo)", debit: 30400, credit: 0 },
  { concept: "Seguro (ejemplo)", debit: 50000, credit: 0 },
  { concept: "Giro al propietario", debit: 1759600, credit: 0 },
];
const tenantRows = [
  { concept: "Canon de arrendamiento", debit: 2000000, credit: 0 },
  { concept: "Administración (ejemplo)", debit: 250000, credit: 0 },
  { concept: "Pago recibido (ejemplo)", debit: 0, credit: 1000000 },
];

export default function AccountsDraft() {
  const [profile, setProfile] = useState<Profile>("propietario");
  const [entered, setEntered] = useState(false);
  const [year, setYear] = useState("2026");
  const [property, setProperty] = useState("todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ period: string; property: string } | null>(null);
  const [consolidated, setConsolidated] = useState(false);
  const documents = periods.flatMap(period => properties.map(property => ({ period, property })))
    .filter(doc => (property === "todos" || doc.property === property) && `${doc.period} ${doc.property}`.toLocaleLowerCase("es-CO").includes(query.toLocaleLowerCase("es-CO")));
  const reset = () => { setEntered(false); setSelected(null); setQuery(""); setProperty("todos"); setConsolidated(false); };

  return <main className={styles.page}>
    <div className={styles.notice}>BORRADOR · Datos ficticios · Acceso de demostración</div>
    <header className={styles.header}>
      <a href="/" aria-label="Volver al Portal Kiosko"><Image src={logo} alt="Kiosko Inmobiliario" width={100} height={116} unoptimized /></a>
      <span>Tu centro de documentos</span>
      {entered ? <button onClick={reset}>Salir de la demostración</button> : <a href="/">Volver al portal</a>}
    </header>
    {!entered ? <section className={styles.login}>
      <div className={styles.intro}><span className={styles.eyebrow}>PORTAL KIOSKO</span><h1>La información de tu inmueble, a tu alcance.</h1><p>Consulta tus documentos y movimientos desde un solo lugar.</p>
        <ul><li>Estados de cuenta por periodo e inmueble</li><li>Cuentas de cobro y detalle de movimientos</li><li>Facturas y certificados organizados</li></ul>
        <p className={styles.muted}>Propuesta de interfaz inspirada en SIMIDocs. La conexión con los documentos de Kiosko está pendiente.</p>
      </div>
      <div className={styles.card}><h2>Inicia sesión</h2><p>Selecciona tu perfil para explorar el borrador.</p>
        <div className={styles.profiles} aria-label="Perfil de demostración">
          <button aria-pressed={profile === "propietario"} onClick={() => setProfile("propietario")}>Soy propietario</button>
          <button aria-pressed={profile === "inquilino"} onClick={() => setProfile("inquilino")}>Soy inquilino</button>
        </div>
        <label className={styles.field}>Documento<input disabled placeholder="Disponible al conectar el acceso real" autoComplete="off" /></label>
        <label className={styles.field}>Contraseña<input disabled type="password" placeholder="Disponible al conectar el acceso real" autoComplete="off" /></label>
        <label className={styles.field}>Año de consulta<select value={year} onChange={e => setYear(e.target.value)}><option>2026</option><option>2025</option></select></label>
        <button className={styles.primary} onClick={() => setEntered(true)}>Explorar demo de {profile}</button>
        <p className={styles.muted}>Este borrador no recibe credenciales. El inicio de sesión y la recuperación de contraseña se conectarán al servicio de identidad.</p>
      </div>
    </section> : <section className={styles.dashboard}>
      <div className={styles.title}><div><span className={styles.eyebrow}>{profile === "propietario" ? "PROPIETARIOS" : "INQUILINOS"}</span><h1>{profile === "propietario" ? "Tus estados de cuenta" : "Tus cuentas de cobro"}</h1><p>Cuenta de demostración · {year} · Todos los valores son ficticios</p></div><button onClick={reset}>Cambiar perfil</button></div>
      <div className={styles.stats}><article><span>{profile === "propietario" ? "Abonos del periodo por inmueble" : "Cargos del periodo por inmueble"}</span><strong>{money(profile === "propietario" ? 2000000 : 2250000)}</strong></article><article><span>{profile === "propietario" ? "Giro de ejemplo por inmueble" : "Pago recibido por inmueble"}</span><strong>{money(profile === "propietario" ? 1759600 : 1000000)}</strong></article><article><span>Saldo de ejemplo por inmueble</span><strong>{money(profile === "propietario" ? 0 : 1250000)}</strong></article></div>
      <div className={styles.card}>
        <div className={styles.filters}><label className={styles.field}>Año<select value={year} onChange={e => { setYear(e.target.value); setSelected(null); }}><option>2026</option><option>2025</option></select></label><label className={styles.field}>Inmueble<select value={property} onChange={e => { setProperty(e.target.value); setSelected(null); }}><option value="todos">Todos los inmuebles</option>{properties.map(p => <option key={p}>{p}</option>)}</select></label><label className={styles.field}>Buscar periodo o inmueble<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ej.: Agosto" /></label></div>
        <h2>Documentos disponibles</h2><p className={styles.muted}>Muestra ficticia de {year}. Cambiar el año únicamente modifica el contexto de la demostración.</p>
        <div className={styles.tableWrap}><table><caption className={styles.srOnly}>Documentos de demostración por periodo e inmueble</caption><thead><tr><th scope="col">Periodo</th><th scope="col">Inmueble</th><th scope="col">Documento</th><th scope="col">Consultar</th></tr></thead><tbody>{documents.map(doc => <tr key={`${doc.period}-${doc.property}`}><td>{doc.period} {year}</td><td>{doc.property}</td><td>{profile === "propietario" ? "Estado de cuenta" : "Cuenta de cobro"}</td><td><button onClick={() => { setSelected(doc); setConsolidated(false); }}>Ver detalle <span className={styles.srOnly}>{doc.period} {doc.property}</span></button>{profile === "propietario" && <button onClick={() => { setSelected(doc); setConsolidated(true); }}>Consolidado <span className={styles.srOnly}>{doc.period}</span></button>}</td></tr>)}</tbody></table></div>
        <p role="status">{documents.length ? `${documents.length} documentos de ejemplo` : "No hay documentos que coincidan con tu búsqueda."}</p>
      </div>
      {selected && <section className={styles.card} aria-labelledby="statement-title">
        <div className={styles.title}><div><span className={styles.eyebrow}>DOCUMENTO DE DEMOSTRACIÓN</span><h2 id="statement-title">{profile === "propietario" ? "Estado de cuenta" : "Cuenta de cobro"} · {selected.period} {year}</h2><p>{consolidated ? "Consolidado de los dos inmuebles de ejemplo" : selected.property}</p>{profile === "inquilino" && <p>Vencimiento de ejemplo: 5 de {selected.period.toLowerCase()} de {year}</p>}</div><button onClick={() => setSelected(null)}>Cerrar detalle</button></div>
        {(consolidated ? properties : [selected.property]).map(p => {
          let balance = 0;
          const rows = profile === "propietario" ? ownerRows : tenantRows;
          return <div key={p}><h3>{p}</h3><div className={styles.tableWrap}><table><caption className={styles.srOnly}>Movimientos ficticios de {p}</caption><thead><tr><th scope="col">Descripción</th><th scope="col">{profile === "propietario" ? "Descuentos / giros" : "Cargos"}</th><th scope="col">Abonos</th><th scope="col">Saldo</th></tr></thead><tbody><tr><td>Saldo inicial</td><td>{money(0)}</td><td>{money(0)}</td><td>{money(0)}</td></tr>{rows.map(row => { balance += profile === "propietario" ? row.credit - row.debit : row.debit - row.credit; return <tr key={row.concept}><td>{row.concept}</td><td>{money(row.debit)}</td><td>{money(row.credit)}</td><td>{money(balance)}</td></tr>; })}</tbody><tfoot><tr><th scope="row">Saldo final</th><td></td><td></td><td>{money(balance)}</td></tr></tfoot></table></div></div>;
        })}
        <p className={styles.muted}>Vista de ejemplo sin validez contable. Descarga PDF y documentos originales pendientes de integración.</p>
      </section>}
      <div className={styles.categories}>{["Facturas electrónicas", "Facturas", "Notas crédito", "Certificados"].map(title => <article className={styles.card} key={title}><h3>{title}</h3><p>No hay documentos en esta demostración.</p></article>)}</div>
    </section>}
    <footer className={styles.footer}>Kiosko Inmobiliario · Prototipo para revisión · Sin conexión a SIMI ni a pagos</footer>
  </main>;
}
