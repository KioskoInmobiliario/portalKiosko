export type DashboardMetric = {
  id: 'leads' | 'available_properties' | 'appointments' | 'pending_payments';
  label: string;
  value: string;
  description: string;
};

export type PipelineStage = {
  id: string;
  label: string;
  value: number;
  accent: 'sky' | 'slate';
};

export type DashboardProperty = {
  id: string;
  code: string;
  title: string;
  status: 'Disponible' | 'En negociación' | 'Arrendada' | 'Vendida' | 'Inactiva';
  value: string;
  detail: string;
};

export type DashboardAgendaItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
};

export type DashboardTeamActivity = {
  id: string;
  name: string;
  metric: string;
  progress: number;
};

export type DashboardFinanceSummary = {
  label: string;
  value: string;
  description: string;
};

export type AdminDashboardData = {
  generatedAt: string;
  source: 'seed' | 'database';
  metrics: DashboardMetric[];
  pipeline: PipelineStage[];
  properties: DashboardProperty[];
  agenda: DashboardAgendaItem[];
  team: DashboardTeamActivity[];
  finance: DashboardFinanceSummary;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return {
    generatedAt: new Date().toISOString(),
    source: 'seed',
    metrics: [
      { id: 'leads', label: 'Prospectos activos', value: '37', description: 'Contactos en seguimiento comercial' },
      { id: 'available_properties', label: 'Inmuebles disponibles', value: '14', description: 'Inventario libre o en promoción' },
      { id: 'appointments', label: 'Citas esta semana', value: '11', description: 'Visitas, llamadas y reuniones agendadas' },
      { id: 'pending_payments', label: 'Pagos pendientes', value: '8', description: 'Cuentas por validar o cobrar' },
    ],
    pipeline: [
      { id: 'new_contact', label: 'Nuevo contacto', value: 18, accent: 'sky' },
      { id: 'visit_scheduled', label: 'Visita agendada', value: 9, accent: 'slate' },
      { id: 'negotiation', label: 'Negociación', value: 6, accent: 'sky' },
      { id: 'closing_pending', label: 'Cierre pendiente', value: 4, accent: 'slate' },
    ],
    properties: [
      { id: 'property-ch-502', code: 'CH-502', title: 'Apartamento Chicó', status: 'Disponible', value: '$3.800.000', detail: '92 m2 · 2 alcobas' },
      { id: 'property-ct-1204', code: 'CT-1204', title: 'Apartamento Cedritos', status: 'En negociación', value: '$2.900.000', detail: '78 m2 · 1 parqueadero' },
      { id: 'property-sb-301', code: 'SB-301', title: 'Oficina Santa Bárbara', status: 'Arrendada', value: '$5.100.000', detail: '124 m2 · contrato activo' },
    ],
    agenda: [
      { id: 'agenda-owner-call', time: '09:00', title: 'Llamada propietario', detail: 'Validar precio de captación' },
      { id: 'agenda-visit', time: '11:30', title: 'Visita inmueble', detail: 'Cliente interesado en Cedritos' },
      { id: 'agenda-payments', time: '15:00', title: 'Seguimiento cartera', detail: 'Cuenta de cobro pendiente' },
    ],
    team: [
      { id: 'agent-commercial-1', name: 'Comercial 1', metric: '8 visitas', progress: 76 },
      { id: 'agent-commercial-2', name: 'Comercial 2', metric: '5 cierres', progress: 64 },
      { id: 'agent-operations', name: 'Operaciones', metric: '21 gestiones', progress: 88 },
    ],
    finance: {
      label: 'Proyección mensual',
      value: '$84.6M',
      description: 'Arriendos, administración y comisiones estimadas.',
    },
  };
}
