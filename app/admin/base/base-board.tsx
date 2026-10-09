'use client';

import { useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import type { AdminBaseData, BaseClient, BaseOwner, BaseProperty } from '@/lib/admin-base';
import styles from './base.module.css';

type Section = 'clients' | 'properties' | 'owners';
type EditableRow = BaseClient | BaseProperty | BaseOwner;

const sectionLabels: Record<Section, string> = {
  clients: 'Clientes',
  properties: 'Propiedades',
  owners: 'Propietarios',
};

const emptyRows: Record<Section, EditableRow> = {
  clients: {
    id: '',
    fullName: '',
    role: 'Propietario',
    documentType: 'CC',
    documentNumber: '',
    email: '',
    phone: '',
    status: 'Pendiente',
  },
  properties: {
    id: '',
    code: '',
    address: '',
    owner: '',
    tenant: '',
    status: 'Libre',
    rent: '$0',
    contractReference: '',
  },
  owners: {
    id: '',
    fullName: '',
    documentNumber: '',
    properties: 0,
    portfolioValue: '$0',
    status: 'Pendiente',
  },
};

function createId(section: Section) {
  return `${section}-${Date.now().toString(36)}`;
}

function readValue(row: EditableRow, key: string) {
  const value = row[key as keyof EditableRow];
  return value == null ? '' : String(value);
}

export default function BaseBoard({ initialData }: { initialData: AdminBaseData }) {
  const [section, setSection] = useState<Section>('clients');
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState(initialData.clients);
  const [properties, setProperties] = useState(initialData.properties);
  const [owners, setOwners] = useState(initialData.owners);
  const [editing, setEditing] = useState<{ section: Section; row: EditableRow } | null>(null);

  const rows = useMemo(() => {
    const source = section === 'clients' ? clients : section === 'properties' ? properties : owners;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((row) => JSON.stringify(row).toLowerCase().includes(normalized));
  }, [clients, owners, properties, query, section]);

  const updatedAt = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(initialData.generatedAt));

  function saveRow() {
    if (!editing) return;
    const row = { ...editing.row, id: editing.row.id || createId(editing.section) };
    if (editing.section === 'clients') {
      setClients((current) => upsert(current, row as BaseClient));
    }
    if (editing.section === 'properties') {
      setProperties((current) => upsert(current, row as BaseProperty));
    }
    if (editing.section === 'owners') {
      setOwners((current) => upsert(current, row as BaseOwner));
    }
    setEditing(null);
  }

  function removeRow(id: string) {
    if (section === 'clients') setClients((current) => current.filter((row) => row.id !== id));
    if (section === 'properties') setProperties((current) => current.filter((row) => row.id !== id));
    if (section === 'owners') setOwners((current) => current.filter((row) => row.id !== id));
  }

  function upsert<T extends { id: string }>(current: T[], row: T) {
    return current.some((item) => item.id === row.id) ? current.map((item) => (item.id === row.id ? row : item)) : [row, ...current];
  }

  return (
    <div className={styles.content}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Base central</p>
          <h1>Clientes, propiedades y propietarios en una sola vista</h1>
          <p>Esta pantalla queda preparada para revisar, editar y administrar la información maestra antes de conectarla a la base definitiva.</p>
        </div>
        <div className={styles.statusCard}>
          <span>{initialData.source === 'seed' ? 'Datos semilla' : 'Datos conectados'}</span>
          <strong>{clients.length + properties.length + owners.length}</strong>
          <small>Registros visibles · actualización {updatedAt}</small>
        </div>
      </section>

      <section className={styles.summary} aria-label="Resumen de base">
        <article><span>Clientes</span><strong>{clients.length}</strong></article>
        <article><span>Propiedades</span><strong>{properties.length}</strong></article>
        <article><span>Propietarios</span><strong>{owners.length}</strong></article>
        <article><span>Inmuebles libres</span><strong>{properties.filter((property) => property.status === 'Libre' || property.status === 'Disponible').length}</strong></article>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Tablas de la base">
            {(Object.keys(sectionLabels) as Section[]).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={section === item} onClick={() => setSection(item)}>
                {sectionLabels[item]}
              </button>
            ))}
          </div>
          <label className={styles.search}>
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, documento, inmueble o estado..." />
          </label>
          <button type="button" className={styles.primary} onClick={() => setEditing({ section, row: { ...emptyRows[section] } })}>
            <Plus size={16} /> Nuevo registro
          </button>
        </div>

        <DataTable section={section} rows={rows} onEdit={(row) => setEditing({ section, row })} onDelete={removeRow} />
      </section>

      {editing && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Editar ${sectionLabels[editing.section]}`}>
            <div className={styles.modalTitle}>
              <div>
                <p className={styles.eyebrow}>CRUD preparado</p>
                <h2>{editing.row.id ? 'Editar registro' : 'Crear registro'}</h2>
              </div>
              <button type="button" className={styles.iconButton} onClick={() => setEditing(null)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <EditForm section={editing.section} row={editing.row} onChange={(row) => setEditing({ ...editing, row })} />
            <div className={styles.modalActions}>
              <button type="button" className={styles.light} onClick={() => setEditing(null)}>Cancelar</button>
              <button type="button" className={styles.primary} onClick={saveRow}>Guardar cambios</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DataTable({ section, rows, onEdit, onDelete }: { section: Section; rows: EditableRow[]; onEdit: (row: EditableRow) => void; onDelete: (id: string) => void }) {
  const columns = getColumns(section);

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key} data-label={column.label}>{readValue(row, column.key)}</td>)}
              <td data-label="Acciones">
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => onEdit(row)}><Edit3 size={15} /> Editar</button>
                  <button type="button" onClick={() => onDelete(row.id)}><Trash2 size={15} /> Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className={styles.empty}>No hay registros con estos filtros.</p>}
    </div>
  );
}

function EditForm({ section, row, onChange }: { section: Section; row: EditableRow; onChange: (row: EditableRow) => void }) {
  return (
    <div className={styles.formGrid}>
      {getColumns(section).map((column) => (
        <label key={column.key} className={styles.field}>
          <span>{column.label}</span>
          <input
            type={column.type || 'text'}
            value={readValue(row, column.key)}
            onChange={(event) => onChange({ ...row, [column.key]: column.type === 'number' ? Number(event.target.value) : event.target.value })}
          />
        </label>
      ))}
    </div>
  );
}

function getColumns(section: Section) {
  if (section === 'clients') {
    return [
      { key: 'fullName', label: 'Nombre completo' },
      { key: 'role', label: 'Tipo de cliente' },
      { key: 'documentType', label: 'Tipo doc.' },
      { key: 'documentNumber', label: 'Documento' },
      { key: 'email', label: 'Correo' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'status', label: 'Estado' },
    ];
  }
  if (section === 'properties') {
    return [
      { key: 'code', label: 'Código' },
      { key: 'address', label: 'Dirección' },
      { key: 'owner', label: 'Propietario' },
      { key: 'tenant', label: 'Inquilino' },
      { key: 'status', label: 'Estado' },
      { key: 'rent', label: 'Canon' },
      { key: 'contractReference', label: 'Contrato' },
    ];
  }
  return [
    { key: 'fullName', label: 'Propietario' },
    { key: 'documentNumber', label: 'Documento' },
    { key: 'properties', label: 'Inmuebles', type: 'number' },
    { key: 'portfolioValue', label: 'Cartera' },
    { key: 'status', label: 'Estado' },
  ];
}