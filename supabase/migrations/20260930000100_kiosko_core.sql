-- Preparación para Supabase. Ejecutar solo en desarrollo tras seleccionar proyecto.
-- No contiene datos del Excel. No activa autenticación ni acceso del cliente.
begin;

create table public.ki_clients (
  id uuid primary key default gen_random_uuid(),
  document_type text,
  document_number text,
  full_name text not null check (length(trim(full_name)) > 0),
  email text,
  phone text,
  status text not null default 'pending' check (status in ('pending','verified','inactive')),
  created_at timestamptz not null default now(),
  check ((document_type is null) = (document_number is null)),
  unique (document_type, document_number)
);

create table public.ki_properties (
  id uuid primary key default gen_random_uuid(),
  external_code text unique,
  address text not null,
  building_name text,
  unit_label text,
  area_m2 numeric(12,2) check (area_m2 > 0),
  bedrooms integer check (bedrooms >= 0),
  bathrooms integer check (bathrooms >= 0),
  parking_reference text,
  status text not null default 'pending' check (status in ('pending','active','inactive')),
  created_at timestamptz not null default now()
);

create table public.ki_property_owners (
  property_id uuid not null references public.ki_properties(id),
  client_id uuid not null references public.ki_clients(id),
  starts_on date,
  ends_on date,
  primary key (property_id, client_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.ki_contracts (
  id uuid primary key default gen_random_uuid(),
  external_reference text not null,
  starts_on date,
  ends_on date,
  rent numeric(14,2) not null check (rent >= 0),
  administration numeric(14,2) not null check (administration >= 0),
  monthly_total numeric(14,2) generated always as (rent + administration) stored,
  insurance_provider text,
  status text not null default 'pending' check (status in ('pending','active','ended')),
  created_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
-- No imponer unicidad a la referencia hasta aclarar sus repeticiones en Excel.
create index ki_contracts_reference_idx on public.ki_contracts(external_reference);

create table public.ki_contract_properties (
  contract_id uuid not null references public.ki_contracts(id),
  property_id uuid not null references public.ki_properties(id),
  primary key (contract_id, property_id)
);

create table public.ki_contract_participants (
  contract_id uuid not null references public.ki_contracts(id),
  client_id uuid not null references public.ki_clients(id),
  participant_role text not null check (participant_role in ('tenant','co_tenant','guarantor')),
  primary key (contract_id, client_id, participant_role)
);

create table public.ki_account_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.ki_clients(id),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  revoked_at timestamptz,
  primary key (user_id, client_id),
  check (approved_at is null or approved_by is not null)
);

create table public.ki_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_filename text not null,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'staged' check (status in ('staged','reviewed','applied','failed')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.ki_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.ki_import_batches(id),
  sheet_name text not null,
  source_row integer not null check (source_row > 0),
  original_values jsonb not null,
  normalized_values jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','applied')),
  unique (batch_id, sheet_name, source_row)
);

-- Cerrado por defecto: las políticas de lectura del cliente y del panel
-- se agregarán y probarán junto a su implementación, antes de habilitar datos.
alter table public.ki_clients enable row level security;
alter table public.ki_properties enable row level security;
alter table public.ki_property_owners enable row level security;
alter table public.ki_contracts enable row level security;
alter table public.ki_contract_properties enable row level security;
alter table public.ki_contract_participants enable row level security;
alter table public.ki_account_links enable row level security;
alter table public.ki_import_batches enable row level security;
alter table public.ki_import_rows enable row level security;

revoke all on table
 public.ki_clients, public.ki_properties, public.ki_property_owners,
 public.ki_contracts, public.ki_contract_properties, public.ki_contract_participants,
 public.ki_account_links, public.ki_import_batches, public.ki_import_rows
 from public, anon, authenticated;

-- Procesos administrativos exclusivamente de servidor; nunca usar esta clave en frontend.
grant select, insert, update, delete on table
 public.ki_clients, public.ki_properties, public.ki_property_owners,
 public.ki_contracts, public.ki_contract_properties, public.ki_contract_participants,
 public.ki_account_links, public.ki_import_batches, public.ki_import_rows
 to service_role;

commit;
