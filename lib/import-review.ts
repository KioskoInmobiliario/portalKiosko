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
export interface Client { id: string; full_name: string; document_number: string | null; document_issued_on?: string | null; document_issued_place?: string | null; status: string }
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
 const contractReference = str(n.contract?.external_reference);
 const tenantName = str(n.tenant?.full_name);
 const propertyStatus = !contractReference && !tenantName ? 'available' : str(n.property?.status) || 'pending';
 return {
  property_status: propertyStatus,
  contract_reference: contractReference, rent: str(n.contract?.rent), administration: str(n.contract?.administration),
  starts_on: str(n.contract?.starts_on), insurance_provider: str(n.contract?.insurance_provider), contract_id: '',
  property_code: '', address: str(n.property?.address), building_name: str(n.property?.building_name), unit_label: str(n.property?.unit_label),
  area_m2: str(n.property?.area_m2), bedrooms: str(n.property?.bedrooms), bathrooms: str(n.property?.bathrooms), parking_reference: str(n.property?.parking_reference),
  owner_name: str(n.owner?.full_name), owner_id: '', owner_document_type: '', owner_document_number: '', owner_document_issued_on: '', owner_document_issued_place: '', owner_email: '', owner_phone: '',
  tenant_name: tenantName, tenant_id: '', tenant_document_type: '', tenant_document_number: '', tenant_document_issued_on: str(n.tenant?.document_issued_on), tenant_document_issued_place: str(n.tenant?.document_issued_place), tenant_email: str(n.tenant?.email), tenant_phone: str(n.tenant?.phone),
  guarantor_name: str(n.guarantor?.full_name), guarantor_id: '', guarantor_document_type: '', guarantor_document_number: '', guarantor_document_issued_on: str(n.guarantor?.document_issued_on), guarantor_document_issued_place: str(n.guarantor?.document_issued_place), guarantor_email: '', guarantor_phone: '',
  review_note: '', identity_pending_ack: false, duplicates_ack: false,
 };
}
export function validateDraft(d: Draft): string[] {
 const errors: string[] = [];
 const s = (k: string) => String(d[k] ?? '').trim();
 const emptyTenantMarkers = new Set(['libre','disponible','sin inquilino','vacante','desocupado']);
 const normalizedTenantName = s('tenant_name').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 const hasContractData = ['contract_reference','starts_on','contract_id'].some(k => s(k));
 const hasTenantData = ['tenant_id','tenant_document_type','tenant_document_number','tenant_document_issued_on','tenant_document_issued_place','tenant_email','tenant_phone'].some(k => s(k)) || (!!s('tenant_name') && !emptyTenantMarkers.has(normalizedTenantName));
 const rawPropertyStatus = s('property_status');
 const propertyStatus = (!hasContractData && !hasTenantData && (!rawPropertyStatus || rawPropertyStatus === 'pending')) ? 'available' : rawPropertyStatus || 'pending';
 const isAvailable = propertyStatus === 'available';
 if (!['pending','active','available','inactive'].includes(propertyStatus)) errors.push('Estado del inmueble: seleccione un estado válido.');
 const required: Record<string, string> = { property_code: 'Código único de inmueble', address: 'Dirección', owner_name: 'Nombre de propietario', review_note: 'Nota de revisión' };
 if (!isAvailable) Object.assign(required, { rent: 'Canon mensual', administration: 'Cuota de administración' });
 for (const [k,label] of Object.entries(required)) if (!s(k)) errors.push(`${label}: campo requerido.`);
 for (const k of ['rent','administration']) if ((!isAvailable || s(k)) && !/^\d+(\.\d{1,2})?$/.test(s(k))) errors.push(`${k === 'rent' ? 'Canon' : 'Administración'}: use un importe no negativo, sin separadores de miles.`);
 if ((!isAvailable || s('starts_on')) && s('starts_on') && (!/^\d{4}-\d{2}-\d{2}$/.test(s('starts_on')) || Number.isNaN(Date.parse(s('starts_on'))) || new Date(s('starts_on')).toISOString().slice(0,10) !== s('starts_on'))) errors.push('Fecha de inicio inválida.');
 if (s('area_m2') && (!/^\d+(\.\d{1,2})?$/.test(s('area_m2')) || Number(s('area_m2')) <= 0)) errors.push('Área: use un número positivo en m².');
 for (const k of ['bedrooms','bathrooms']) if (s(k) && !/^\d+$/.test(s(k))) errors.push('Habitaciones y baños deben ser enteros no negativos.');
 for (const p of ['owner','tenant','guarantor']) {
  const label = p === 'owner' ? 'Propietario' : p === 'tenant' ? 'Inquilino' : 'Codeudor';
  const hasPersonData = ['name','document_type','document_number','document_issued_on','document_issued_place','email','phone'].some(k => s(`${p}_${k}`));
  if (isAvailable && p === 'tenant' && (!hasPersonData || emptyTenantMarkers.has(normalizedTenantName)) && !s(`${p}_id`)) continue;
  if (isAvailable && p === 'guarantor' && !hasPersonData && !s(`${p}_id`)) continue;
  if (p === 'guarantor' && !hasPersonData && !s(`${p}_id`)) continue;
  if (p === 'guarantor' && hasPersonData && !s(`${p}_name`)) errors.push('Codeudor: nombre requerido si se registran datos.');
  if (s(`${p}_id`)) continue;
  if (!!s(`${p}_document_type`) !== !!s(`${p}_document_number`)) errors.push('Complete tipo y número de documento, o deje ambos vacíos.');
  if (s(`${p}_document_issued_on`) && (!/^\d{4}-\d{2}-\d{2}$/.test(s(`${p}_document_issued_on`)) || Number.isNaN(Date.parse(s(`${p}_document_issued_on`))) || new Date(s(`${p}_document_issued_on`)).toISOString().slice(0,10) !== s(`${p}_document_issued_on`))) errors.push(`${label}: fecha de expedición inválida.`);
  if (s(`${p}_email`) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(`${p}_email`))) errors.push(`${label}: correo inválido.`);
  if (s(`${p}_phone`) && !/^\+?\d{7,15}$/.test(s(`${p}_phone`))) errors.push(`${label}: teléfono inválido.`);
 }
 if (d.identity_pending_ack !== true) errors.push('Confirme que las identidades quedan pendientes.');
 return [...new Set(errors)];
}
export const money = (v: unknown) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);
