export type Draft = Record<string, string | boolean>;
export interface ImportRow {
 id: string; batch_id: string; source_row: number; sheet_name: string;
 status: 'pending' | 'rejected' | 'applied' | 'approved'; version: number;
 original_values: { values: Record<string, unknown>; cached_values?: Record<string, unknown> };
 normalized_values: Record<string, Record<string, unknown>>;
 reviewed_values: Draft | null; validation_errors: { code: string; field: string }[];
 applied_entities?: Record<string, string>; reviewed_at?: string;
 entity_versions?: Record<string,number>;
}
export interface Client { id: string; full_name: string; document_number: string | null; status: string }
export interface Contract { id: string; external_reference: string; rent: string; administration: string; starts_on: string; insurance_provider: string | null }
export interface ReviewData {
 rows: ImportRow[]; clients: Client[]; contracts: Contract[];
 batches: { id: string; source_filename: string; status: string }[];
 audit: { id: string; row_id: string; actor_id: string; action: string; created_at: string; submitted_values: Draft }[];
}
export const issueLabels: Record<string, string> = {
 owner_identity_and_contact_not_supplied: 'Propietario sin documento ni contacto en Excel',
 repeated_contract_reference: 'Referencia de contrato repetida', missing_contract_reference: 'Falta referencia de contrato',
 missing_tenant_name: 'Falta nombre de inquilino', missing_phone: 'Falta teléfono de inquilino',
 invalid_phone: 'Teléfono de inquilino inválido', missing_email: 'Falta correo de inquilino', invalid_email: 'Correo de inquilino inválido',
 missing_or_invalid_start: 'Fecha de inicio pendiente', missing_area: 'Área pendiente', ambiguous_area_unit: 'Unidad de área ambigua',
 date_in_parking_reference: 'Fecha encontrada en parqueadero', missing_or_invalid_total: 'Total original pendiente de revisión',
};
export function draftFor(row: ImportRow): Draft {
 if (row.reviewed_values) return { ...row.reviewed_values };
 const n = row.normalized_values;
 const str = (v: unknown) => v == null ? '' : String(v);
 return {
  contract_reference: str(n.contract?.external_reference), rent: str(n.contract?.rent), administration: str(n.contract?.administration),
  starts_on: str(n.contract?.starts_on), insurance_provider: str(n.contract?.insurance_provider), contract_id: '',
  property_code: '', address: str(n.property?.address), building_name: str(n.property?.building_name), unit_label: str(n.property?.unit_label),
  area_m2: str(n.property?.area_m2), bedrooms: str(n.property?.bedrooms), bathrooms: str(n.property?.bathrooms), parking_reference: str(n.property?.parking_reference),
  owner_name: str(n.owner?.full_name), owner_id: '', owner_document_type: '', owner_document_number: '', owner_email: '', owner_phone: '',
  tenant_name: str(n.tenant?.full_name), tenant_id: '', tenant_document_type: '', tenant_document_number: '', tenant_email: str(n.tenant?.email), tenant_phone: str(n.tenant?.phone),
  review_note: '', identity_pending_ack: false, duplicates_ack: false,
 };
}
export function validateDraft(d: Draft): string[] {
 const errors: string[] = [];
 const s = (k: string) => String(d[k] ?? '').trim();
 const required: Record<string, string> = { contract_reference: 'Referencia de contrato', starts_on: 'Fecha de inicio', property_code: 'Código único de inmueble', address: 'Dirección', owner_name: 'Nombre de propietario', tenant_name: 'Nombre de inquilino', review_note: 'Nota de revisión' };
 for (const [k,label] of Object.entries(required)) if (!s(k)) errors.push(`${label}: campo requerido.`);
 for (const k of ['rent','administration']) if (!/^\d+(\.\d{1,2})?$/.test(s(k))) errors.push(`${k === 'rent' ? 'Canon' : 'Administración'}: use un importe no negativo, sin separadores de miles.`);
 if (s('starts_on') && (!/^\d{4}-\d{2}-\d{2}$/.test(s('starts_on')) || Number.isNaN(Date.parse(s('starts_on'))) || new Date(s('starts_on')).toISOString().slice(0,10) !== s('starts_on'))) errors.push('Fecha de inicio inválida.');
 if (s('area_m2') && (!/^\d+(\.\d{1,2})?$/.test(s('area_m2')) || Number(s('area_m2')) <= 0)) errors.push('Área: use un número positivo en m².');
 for (const k of ['bedrooms','bathrooms']) if (s(k) && !/^\d+$/.test(s(k))) errors.push('Habitaciones y baños deben ser enteros no negativos.');
 for (const p of ['owner','tenant']) {
  if (s(`${p}_id`)) continue;
  if (!!s(`${p}_document_type`) !== !!s(`${p}_document_number`)) errors.push('Complete tipo y número de documento, o deje ambos vacíos.');
  if (s(`${p}_email`) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(`${p}_email`))) errors.push(`${p === 'owner' ? 'Propietario' : 'Inquilino'}: correo inválido.`);
  if (s(`${p}_phone`) && !/^\+?\d{7,15}$/.test(s(`${p}_phone`))) errors.push(`${p === 'owner' ? 'Propietario' : 'Inquilino'}: teléfono inválido.`);
 }
 if (d.identity_pending_ack !== true) errors.push('Confirme que las identidades quedan pendientes.');
 return [...new Set(errors)];
}
export const money = (v: unknown) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);
