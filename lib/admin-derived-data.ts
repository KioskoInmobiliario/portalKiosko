import { getAdminBaseData, type AdminBaseData, type BaseClient, type BaseOwner, type BaseProperty } from './admin-base';
import { getAdminDashboardData, type AdminDashboardData } from './admin-dashboard';
import { draftFor, money, type ImportRow, type ReviewData } from './import-review';

const personKey = (name: string, document: string) => `${name.trim().toLowerCase()}|${document.trim()}`;

function value(row: ImportRow, key: string) {
  return String((row.reviewed_values ?? draftFor(row))[key] ?? '').trim();
}

function appliedRows(data: ReviewData) {
  return data.rows.filter((row) => row.status === 'applied');
}

export function deriveAdminBaseData(data: ReviewData): AdminBaseData {
  const rows = appliedRows(data);
  const clients = new Map<string, BaseClient>();
  const owners = new Map<string, BaseOwner>();
  const properties: BaseProperty[] = [];

  const addClient = (row: ImportRow, prefix: 'owner' | 'tenant' | 'guarantor', role: BaseClient['role']) => {
    const fullName = value(row, `${prefix}_name`);
    if (!fullName) return;
    const documentNumber = value(row, `${prefix}_document_number`);
    const key = personKey(fullName, documentNumber);
    clients.set(key, {
      id: key,
      fullName,
      role,
      documentType: value(row, `${prefix}_document_type`) || 'Pendiente',
      documentNumber,
      email: value(row, `${prefix}_email`),
      phone: value(row, `${prefix}_phone`),
      status: documentNumber ? 'Activo' : 'Pendiente',
    });
  };

  for (const row of rows) {
    const ownerName = value(row, 'owner_name');
    const ownerDocument = value(row, 'owner_document_number');
    const tenantName = value(row, 'tenant_name');
    const rent = Number(value(row, 'rent')) || 0;
    const administration = Number(value(row, 'administration')) || 0;
    const status = value(row, 'property_status') === 'available' ? 'Libre' : tenantName ? 'Arrendada' : 'Disponible';
    const ownerId = personKey(ownerName, ownerDocument);
    const previousOwner = owners.get(ownerId);

    addClient(row, 'owner', 'Propietario');
    addClient(row, 'tenant', 'Inquilino');
    addClient(row, 'guarantor', 'Codeudor');

    if (ownerName) {
      owners.set(ownerId, {
        id: ownerId,
        fullName: ownerName,
        documentNumber: ownerDocument,
        properties: (previousOwner?.properties ?? 0) + 1,
        portfolioValue: money((Number(previousOwner?.portfolioValue.replace(/[^\d]/g, '')) || 0) + rent + administration),
        status: ownerDocument ? 'Verificado' : 'Pendiente',
      });
    }

    properties.push({
      id: row.applied_entities?.property_id ?? row.id,
      code: value(row, 'property_code') || `Fila ${row.source_row}`,
      address: value(row, 'address') || 'Sin dirección',
      owner: ownerName || 'Propietario pendiente',
      tenant: status === 'Libre' ? '' : tenantName,
      status,
      rent: money(rent + administration),
      contractReference: value(row, 'contract_reference'),
    });
  }

  const fallback = getAdminBaseData();
  return {
    generatedAt: new Date().toISOString(),
    source: 'database',
    clients: clients.size ? [...clients.values()] : fallback.clients,
    owners: owners.size ? [...owners.values()] : fallback.owners,
    properties: properties.length ? properties : fallback.properties,
  };
}

export function deriveAdminDashboardData(data: ReviewData): AdminDashboardData {
  const base = deriveAdminBaseData(data);
  const seed = getAdminDashboardData();
  const activeProperties = base.properties.filter((property) => property.status === 'Arrendada');
  const availableProperties = base.properties.filter((property) => property.status === 'Libre' || property.status === 'Disponible');
  const pendingClients = base.clients.filter((client) => client.status === 'Pendiente');
  const monthlyProjection = activeProperties.reduce((total, property) => total + (Number(property.rent.replace(/[^\d]/g, '')) || 0), 0);

  return {
    ...seed,
    generatedAt: base.generatedAt,
    source: 'database',
    metrics: [
      { id: 'leads', label: 'Clientes pendientes', value: String(pendingClients.length), description: 'Identidades o vínculos por completar' },
      { id: 'available_properties', label: 'Inmuebles disponibles', value: String(availableProperties.length), description: 'Inventario libre o disponible' },
      { id: 'appointments', label: 'Propietarios activos', value: String(base.owners.length), description: 'Propietarios incorporados desde importaciones' },
      { id: 'pending_payments', label: 'Contratos activos', value: String(activeProperties.length), description: 'Inmuebles con contrato o inquilino registrado' },
    ],
    pipeline: [
      { id: 'owners', label: 'Propietarios', value: base.owners.length, accent: 'slate' },
      { id: 'clients', label: 'Clientes', value: base.clients.length, accent: 'sky' },
      { id: 'properties', label: 'Inmuebles', value: base.properties.length, accent: 'slate' },
      { id: 'available', label: 'Disponibles', value: availableProperties.length, accent: 'sky' },
    ],
    properties: base.properties.slice(0, 4).map((property) => ({
      id: property.id,
      code: property.code,
      title: property.address,
      status: property.status === 'Libre' ? 'Disponible' : property.status,
      value: property.rent,
      detail: property.tenant ? `Inquilino: ${property.tenant}` : `Propietario: ${property.owner}`,
    })),
    finance: {
      label: 'Proyección mensual',
      value: money(monthlyProjection),
      description: 'Cálculo desde inmuebles incorporados y contratos activos.',
    },
  };
}