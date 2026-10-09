export type ClientRole = 'Propietario' | 'Inquilino' | 'Codeudor' | 'Prospecto';

export type BaseClient = {
  id: string;
  fullName: string;
  role: ClientRole;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  status: 'Activo' | 'Pendiente' | 'Inactivo';
};

export type BaseOwner = {
  id: string;
  fullName: string;
  documentNumber: string;
  properties: number;
  portfolioValue: string;
  status: 'Verificado' | 'Pendiente';
};

export type BaseProperty = {
  id: string;
  code: string;
  address: string;
  owner: string;
  tenant: string;
  status: 'Libre' | 'Disponible' | 'Arrendada' | 'En negociación' | 'Vendida';
  rent: string;
  contractReference: string;
};

export type AdminBaseData = {
  generatedAt: string;
  source: 'seed' | 'database';
  clients: BaseClient[];
  owners: BaseOwner[];
  properties: BaseProperty[];
};

export function getAdminBaseData(): AdminBaseData {
  return {
    generatedAt: new Date().toISOString(),
    source: 'seed',
    clients: [
      {
        id: 'client-laura-zarate',
        fullName: 'Propietaria Demo Uno',
        role: 'Propietario',
        documentType: 'CC',
        documentNumber: '900000001',
        email: 'propietaria.demo1@example.com',
        phone: '300 000 0001',
        status: 'Activo',
      },
      {
        id: 'client-diego-vargas',
        fullName: 'Inquilino Demo Uno',
        role: 'Inquilino',
        documentType: 'CC',
        documentNumber: '900000002',
        email: 'inquilino.demo1@example.com',
        phone: '300 000 0002',
        status: 'Pendiente',
      },
      {
        id: 'client-tyson-avila',
        fullName: 'Codeudor Demo Uno',
        role: 'Codeudor',
        documentType: 'CC',
        documentNumber: '900000003',
        email: 'codeudor.demo1@example.com',
        phone: '300 000 0003',
        status: 'Activo',
      },
    ],
    owners: [
      {
        id: 'owner-laura-zarate',
        fullName: 'Propietaria Demo Uno',
        documentNumber: '900000001',
        properties: 2,
        portfolioValue: '$7.900.000',
        status: 'Verificado',
      },
      {
        id: 'owner-andrea-zarate',
        fullName: 'Propietaria Demo Dos',
        documentNumber: '900000004',
        properties: 1,
        portfolioValue: '$3.200.000',
        status: 'Pendiente',
      },
    ],
    properties: [
      {
        id: 'property-ch-502',
        code: 'CH-502',
        address: 'Apartamento Chicó 502',
        owner: 'Propietaria Demo Uno',
        tenant: 'Inquilino Demo Uno',
        status: 'Arrendada',
        rent: '$3.800.000',
        contractReference: 'CT-2026-0502',
      },
      {
        id: 'property-ct-1204',
        code: 'CT-1204',
        address: 'Apartamento Cedritos 1204',
        owner: 'Propietaria Demo Dos',
        tenant: '',
        status: 'Libre',
        rent: '$0',
        contractReference: '',
      },
      {
        id: 'property-sb-301',
        code: 'SB-301',
        address: 'Oficina Santa Barbara 301',
        owner: 'Propietaria Demo Uno',
        tenant: 'Cliente empresarial',
        status: 'En negociación',
        rent: '$5.100.000',
        contractReference: 'CT-2026-0301',
      },
    ],
  };
}