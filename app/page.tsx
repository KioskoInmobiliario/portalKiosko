"use client";

import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  Headphones,
  Home,
  KeyRound,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "573024236366";
const WEBSITE_URL = "https://www.kioskoinmobiliario.com";
const PSE_PAYMENT_URL = "https://www.psecomercio.scotiabankcolpatria.com/payment/12293";

type ServiceKey = "maintenance" | "statement" | "contact" | null;
type Role = "arrendatario" | "propietario";

const quickServices = [
  {
    key: "pay",
    icon: WalletCards,
    title: "Pagar arriendo",
    copy: "Accede al canal de pago PSE publicado por Kiosko.",
    label: "Ir a pagos",
    href: PSE_PAYMENT_URL,
    external: true,
  },
  {
    key: "statement",
    icon: ReceiptText,
    title: "Cuenta de cobro",
    copy: "Solicita tu cuenta, saldo o soporte de movimientos.",
    label: "Solicitar cuenta",
  },
  {
    key: "maintenance",
    icon: Wrench,
    title: "Reportar mantenimiento",
    copy: "Describe la novedad y deja la información para atención técnica.",
    label: "Crear solicitud",
    tag: "NFC",
  },
  {
    key: "contact",
    icon: MessageCircle,
    title: "Hablar con Kiosko",
    copy: "Resuelve consultas de contratos, pagos y administración.",
    label: "Ver contactos",
  },
] as const;

const roleServices = {
  arrendatario: [
    { icon: Banknote, title: "Pagos y soportes", copy: "Consulta los canales de pago y reporta un comprobante." },
    { icon: FileText, title: "Contrato y documentos", copy: "Solicita copias o aclaraciones sobre tu contrato." },
    { icon: Wrench, title: "Mantenimientos", copy: "Registra una novedad con datos claros para agilizar la visita." },
    { icon: CalendarClock, title: "Fechas importantes", copy: "Consulta vencimientos, incrementos y procesos de entrega." },
  ],
  propietario: [
    { icon: ReceiptText, title: "Detalle de pago", copy: "Solicita el detalle del giro y los descuentos aplicados." },
    { icon: Building2, title: "Estado del inmueble", copy: "Consulta novedades operativas, ocupación y administración." },
    { icon: ClipboardList, title: "Autorizaciones", copy: "Responde solicitudes de mantenimiento y decisiones pendientes." },
    { icon: KeyRound, title: "Captación y arriendo", copy: "Inicia la administración, valoración o comercialización de un inmueble." },
  ],
};

function Logo() {
 return <a className="brand" href="#inicio" aria-label="Portal Kiosko, inicio"><Image src="/kiosko-logo.png" alt="Kiosko Inmobiliario" width={1356} height={1800} className="brand-logo" priority /></a>;
}

function WhatsAppButton({ message, children, className = "" }: { message: string; children: React.ReactNode; className?: string }) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export default function HomePage() {
  const [role, setRole] = useState<Role>("arrendatario");
  const [activeService, setActiveService] = useState<ServiceKey>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("servicio") === "mantenimiento" || params.get("origen") === "nfc") {
        setActiveService("maintenance");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activeService ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeService]);

  const currentServices = useMemo(() => roleServices[role], [role]);

  const openService = (key: string) => {
    if (key === "maintenance" || key === "statement" || key === "contact") setActiveService(key);
  };

  return (
    <main id="inicio">
      <div className="service-strip">
        <span><span className="status-dot" /> Atención digital disponible</span>
        <span>Lunes a viernes 8:00 a.m.–5:00 p.m. · Sábados 8:00 a.m.–1:00 p.m.</span>
      </div>

      <header className="site-header">
        <Logo />
        <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Navegación principal">
          <a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a>
          <a href="#perfiles" onClick={() => setMenuOpen(false)}>Propietarios</a>
          <a href="#perfiles" onClick={() => { setRole("arrendatario"); setMenuOpen(false); }}>Arrendatarios</a>
          <a href="#ayuda" onClick={() => setMenuOpen(false)}>Ayuda</a>
        </nav>
        <div className="header-access"><Link href="/admin/importaciones" className="access-login" title="Acceso Panel Administrativo">Login <KeyRound size={16}/></Link><Link href="/registro" className="access-register">Registro <UserRound size={16}/></Link></div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero section-shell">
        <div className="hero-copy">
          <span className="eyebrow">Portal de propietarios y arrendatarios</span>
          <h1>Tu inmueble,<br />más cerca de ti</h1>
          <p>Pagos, cuentas de cobro, mantenimientos y consultas en un solo lugar.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#servicios">Ver servicios <ArrowRight /></a>
            <button className="button button-secondary" onClick={() => setActiveService("maintenance")}>Reportar reparación <Wrench /></button>
          </div>
          <div className="trust-line"><ShieldCheck /> Tus documentos y datos privados nunca se muestran en esta página pública.</div>
        </div>

        <div className="portal-card" aria-label="Resumen de servicios del portal">
          <div className="portal-sidebar">
            <span className="mini-mark"><Home /></span>
            <span className="side-item active"><Home /> Inicio</span>
            <span className="side-item"><ReceiptText /> Cuentas</span>
            <span className="side-item"><WalletCards /> Pagos</span>
            <span className="side-item"><Wrench /> Mantenimiento</span>
            <span className="side-item"><MessageCircle /> Contacto</span>
          </div>
          <div className="portal-content">
            <div className="portal-heading">
              <div><span className="portal-kicker">CENTRO DE SERVICIOS</span><h2>¿Qué necesitas gestionar?</h2></div>
              <BadgeCheck />
            </div>
            <div className="portal-role-toggle" aria-label="Seleccionar perfil">
              <button className={role === "arrendatario" ? "active" : ""} onClick={() => setRole("arrendatario")}><UserRound /> Arrendatario</button>
              <button className={role === "propietario" ? "active" : ""} onClick={() => setRole("propietario")}><Building2 /> Propietario</button>
            </div>
            <div className="summary-grid">
              <button onClick={() => window.open(PSE_PAYMENT_URL, "_blank", "noopener,noreferrer") }><WalletCards /><span><strong>Pago PSE</strong><small>Canal oficial de pagos</small></span><ArrowRight /></button>
              <button onClick={() => setActiveService("statement")}><ReceiptText /><span><strong>Cuenta de cobro</strong><small>Solicita saldo o copia</small></span><ArrowRight /></button>
              <button onClick={() => setActiveService("maintenance")}><Wrench /><span><strong>Mantenimiento</strong><small>Radica una novedad</small></span><ArrowRight /></button>
            </div>
            <div className="portal-note"><Smartphone /><div><strong>¿Llegaste desde el llavero NFC?</strong><span>Tu solicitud de mantenimiento queda lista en menos de dos minutos.</span></div></div>
          </div>
        </div>
      </section>

      <section className="quick-section" id="servicios">
        <div className="section-shell">
          <div className="section-heading"><div><span className="overline">GESTIONES FRECUENTES</span><h2>Accesos rápidos</h2></div><p>Elige la gestión que necesitas. Te llevamos directamente al canal correcto.</p></div>
          <div className="quick-grid">
            {quickServices.map((service) => {
              const Icon = service.icon;
              const content = <><div className="service-icon"><Icon /></div><div className="service-text"><h3>{service.title}{'tag' in service && <span className="nfc-tag">{service.tag}</span>}</h3><p>{service.copy}</p><span>{service.label} <ArrowRight /></span></div></>;
              return 'external' in service && service.external ? <a className="quick-card" key={service.key} href={service.href} target="_blank" rel="noreferrer">{content}</a> : <button className="quick-card" key={service.key} onClick={() => openService(service.key)}>{content}</button>;
            })}
          </div>
        </div>
      </section>

      <section className="profile-section section-shell" id="perfiles">
        <div className="section-heading centered"><div><span className="overline">UN PORTAL PARA CADA NECESIDAD</span><h2>Selecciona tu perfil</h2></div><p>Encuentra las gestiones y respuestas más relevantes para ti.</p></div>
        <div className="profile-switch" role="tablist">
          <button role="tab" aria-selected={role === "arrendatario"} className={role === "arrendatario" ? "active" : ""} onClick={() => setRole("arrendatario")}><UserRound /> Soy arrendatario</button>
          <button role="tab" aria-selected={role === "propietario"} className={role === "propietario" ? "active" : ""} onClick={() => setRole("propietario")}><Building2 /> Soy propietario</button>
        </div>
        <div className="role-panel">
          <div className="role-intro">
            <span className="role-icon">{role === "arrendatario" ? <KeyRound /> : <Building2 />}</span>
            <span className="overline">{role === "arrendatario" ? "PARA QUIEN HABITA" : "PARA QUIEN CONFÍA SU INMUEBLE"}</span>
            <h3>{role === "arrendatario" ? "Resuelve lo cotidiano sin dar vueltas" : "Mantén el control sin asumir toda la operación"}</h3>
            <p>{role === "arrendatario" ? "Centralizamos las solicitudes más frecuentes para darte una respuesta ordenada y trazable." : "Consulta novedades, solicita soportes y toma decisiones con el acompañamiento de Kiosko."}</p>
            <WhatsAppButton className="text-link" message={`Hola Kiosko, soy ${role} y necesito ayuda con una gestión.`}>Hablar con un asesor <ArrowRight /></WhatsAppButton>
          </div>
          <div className="role-services">
            {currentServices.map(({ icon: Icon, title, copy }) => <article key={title}><Icon /><div><h4>{title}</h4><p>{copy}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="nfc-section">
        <div className="section-shell nfc-layout">
          <div className="nfc-copy">
            <span className="eyebrow light">Servicio desde tu llavero</span>
            <h2>Escanea. Reporta.<br />Nosotros coordinamos.</h2>
            <p>El NFC del llavero puede abrir directamente el formulario de mantenimiento del inmueble, sin buscar teléfonos ni explicar desde cero dónde vives.</p>
            <button className="button button-white" onClick={() => setActiveService("maintenance")}>Probar solicitud NFC <ArrowRight /></button>
          </div>
          <div className="nfc-steps">
            <article><span>1</span><div><Smartphone /><h3>Acerca tu celular</h3><p>Escanea el llavero NFC entregado con las llaves.</p></div></article>
            <article><span>2</span><div><ClipboardList /><h3>Describe la novedad</h3><p>Indica qué sucede, nivel de urgencia y disponibilidad.</p></div></article>
            <article><span>3</span><div><Wrench /><h3>Recibe seguimiento</h3><p>Kiosko revisa la solicitud y coordina la atención.</p></div></article>
          </div>
        </div>
      </section>

      <section className="help-section section-shell" id="ayuda">
        <div className="section-heading"><div><span className="overline">ANTES DE CONTACTARNOS</span><h2>Preguntas frecuentes</h2></div><p>Respuestas breves para las gestiones más comunes.</p></div>
        <div className="faq-layout">
          <div className="faq-list">
            {[
              ["¿Dónde encuentro el pago por PSE?", "El botón “Pagar arriendo” abre directamente el canal oficial de recaudo PSE de Kiosko Inmobiliario en Scotiabank Colpatria. Verifica siempre el dominio antes de pagar."],
              ["¿Cómo solicito una cuenta de cobro?", "Usa “Solicitar cuenta”, identifica el inmueble y el periodo. El equipo validará tu identidad antes de compartir información financiera."],
              ["¿Qué se considera un mantenimiento urgente?", "Situaciones con riesgo para personas, seguridad o daños crecientes —como fugas activas, riesgo eléctrico o imposibilidad de asegurar el inmueble— deben reportarse de inmediato."],
              ["¿El NFC guarda información personal?", "No. El llavero solo abre una dirección web. Los datos privados no se almacenan en el NFC ni se muestran públicamente."],
            ].map(([question, answer], index) => <article className={openFaq === index ? "faq-item open" : "faq-item"} key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{question}</span><ChevronDown /></button>{openFaq === index && <p>{answer}</p>}</article>)}
          </div>
          <aside className="contact-card">
            <span className="contact-icon"><Headphones /></span>
            <h3>¿Necesitas ayuda humana?</h3>
            <p>Estamos disponibles para orientarte y dirigir tu solicitud al área correcta.</p>
            <WhatsAppButton className="button button-primary" message="Hola Kiosko, necesito ayuda con una gestión del portal."><MessageCircle /> Escribir por WhatsApp</WhatsAppButton>
            <a href="mailto:contacto@kioskoinmobiliario.com"><Mail /> contacto@kioskoinmobiliario.com</a>
            <a href="tel:+573024236366"><Phone /> 302 423 6366</a>
          </aside>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-main"><div><Logo /><p>Arrendamientos · Administración · Ventas · Avalúos · Mantenimiento</p></div><div><strong>Oficina</strong><span>Calle 81 #11-68, Oficina 713</span><span>Bogotá D.C.</span></div><div><strong>Enlaces</strong><a href={WEBSITE_URL} target="_blank" rel="noreferrer">Sitio web principal</a><button onClick={() => setActiveService("contact")}>Canales de atención</button></div></div>
        <div className="footer-bottom section-shell"><span>© 2026 Kiosko Inmobiliario</span><span>Portal de propietarios y arrendatarios</span></div>
      </footer>

      {activeService && <ServiceModal service={activeService} onClose={() => setActiveService(null)} />}
    </main>
  );
}

function ServiceModal({ service, onClose }: { service: Exclude<ServiceKey, null>; onClose: () => void }) {
  if (service === "contact") {
    return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Cerrar"><X /></button><span className="modal-icon"><MessageCircle /></span><h2 id="contact-title">Hablemos</h2><p className="modal-lead">Elige el canal que prefieras. Te ayudaremos a dirigir la solicitud al área correcta.</p><div className="contact-options"><WhatsAppButton message="Hola Kiosko, necesito ayuda con una gestión del portal."><MessageCircle /><span><strong>WhatsApp</strong><small>302 423 6366</small></span><ArrowRight /></WhatsAppButton><a href="mailto:contacto@kioskoinmobiliario.com"><Mail /><span><strong>Correo electrónico</strong><small>contacto@kioskoinmobiliario.com</small></span><ArrowRight /></a><a href="tel:+573239614663"><Phone /><span><strong>Línea alterna</strong><small>323 961 4663</small></span><ArrowRight /></a></div></section></div>;
  }

  const isMaintenance = service === "maintenance";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines = isMaintenance
      ? ["Hola Kiosko, deseo reportar una solicitud de mantenimiento.", `Inmueble: ${data.get("property")}`, `Nombre: ${data.get("name")}`, `Novedad: ${data.get("detail")}`, `Urgencia: ${data.get("urgency")}`, `Disponibilidad: ${data.get("availability")}`]
      : ["Hola Kiosko, deseo solicitar una cuenta de cobro.", `Inmueble: ${data.get("property")}`, `Nombre: ${data.get("name")}`, `Periodo solicitado: ${data.get("period")}`, `Tipo de usuario: ${data.get("role")}`];
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Cerrar"><X /></button><span className="modal-icon">{isMaintenance ? <Wrench /> : <ReceiptText />}</span><span className="overline">SOLICITUD DIGITAL</span><h2 id="form-title">{isMaintenance ? "Reportar mantenimiento" : "Solicitar cuenta de cobro"}</h2><p className="modal-lead">{isMaintenance ? "Completa los datos esenciales. Abriremos WhatsApp con tu solicitud organizada para enviarla a Kiosko." : "Por seguridad, validaremos tu identidad antes de compartir saldos o documentos."}</p><form onSubmit={submit}><label>Nombre completo<input name="name" required autoComplete="name" placeholder="Tu nombre" /></label><label>Inmueble<input name="property" required placeholder="Dirección y apartamento" /></label>{isMaintenance ? <><label>¿Qué está sucediendo?<textarea name="detail" required rows={3} placeholder="Describe la novedad con claridad" /></label><div className="form-row"><label>Nivel de urgencia<select name="urgency" defaultValue="Normal"><option>Normal</option><option>Prioritario</option><option>Urgente</option></select></label><label>Disponibilidad<input name="availability" required placeholder="Ej. mañana 9–12" /></label></div></> : <div className="form-row"><label>Periodo solicitado<input name="period" required placeholder="Ej. julio de 2026" /></label><label>Tipo de usuario<select name="role" defaultValue="Arrendatario"><option>Arrendatario</option><option>Propietario</option></select></label></div>}<p className="privacy-note"><ShieldCheck /> La solicitud se envía por WhatsApp. No se guarda información en esta página.</p><button className="button button-primary submit-button" type="submit">Continuar en WhatsApp <ArrowRight /></button></form></section></div>;
}
