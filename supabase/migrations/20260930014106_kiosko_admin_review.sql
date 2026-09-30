-- Administrative RPCs are callable only by the trusted Edge Function.
create table public.ki_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.ki_admins enable row level security;
revoke all on public.ki_admins from public, anon, authenticated;
grant select on public.ki_admins to service_role;

alter table public.ki_import_rows
 add column reviewed_values jsonb,
 add column version integer not null default 0,
 add column reviewed_by uuid references auth.users(id),
 add column reviewed_at timestamptz,
 add column applied_entities jsonb;
create index ki_import_rows_reviewed_by_idx on public.ki_import_rows(reviewed_by);

create table public.ki_import_audit (
 id uuid primary key default gen_random_uuid(),
 row_id uuid not null references public.ki_import_rows(id),
 actor_id uuid not null references auth.users(id),
 action text not null check (action in ('save','reject','apply')),
 previous_values jsonb,
 submitted_values jsonb not null,
 entities jsonb,
 created_at timestamptz not null default now()
);
create index ki_import_audit_row_idx on public.ki_import_audit(row_id, created_at);
create index ki_import_audit_actor_idx on public.ki_import_audit(actor_id);
alter table public.ki_import_audit enable row level security;
revoke all on public.ki_import_audit from public, anon, authenticated;
grant select, insert on public.ki_import_audit to service_role;

create function public.ki_admin_require(p_actor uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 if p_actor is null or not exists (select 1 from public.ki_admins where user_id=p_actor and active) then
  raise exception 'Acceso administrativo requerido' using errcode='42501';
 end if;
end;
$$;

create function public.ki_admin_list(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
 perform public.ki_admin_require(p_actor);
 return jsonb_build_object(
  'batches',coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from public.ki_import_batches b),'[]'::jsonb),
  'rows',coalesce((select jsonb_agg(to_jsonb(r) order by r.source_row) from public.ki_import_rows r),'[]'::jsonb),
  'clients',coalesce((select jsonb_agg(to_jsonb(c) order by c.full_name) from public.ki_clients c),'[]'::jsonb),
  'contracts',coalesce((select jsonb_agg(to_jsonb(c) order by c.external_reference) from public.ki_contracts c),'[]'::jsonb),
  'audit',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from public.ki_import_audit a),'[]'::jsonb)
 );
end;
$$;

create function public.ki_admin_review(p_actor uuid,p_row uuid,p_version integer,p_action text,p_values jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
 r public.ki_import_rows%rowtype;
 owner_id uuid; tenant_id uuid; property_id uuid; contract_id uuid;
 amount numeric; fee numeric; start_date date; area numeric; rooms integer; baths integer;
 person jsonb; person_id uuid; existing_id uuid; k text;
 result jsonb; old_values jsonb;
begin
 perform public.ki_admin_require(p_actor);
 if p_action not in ('save','reject','apply') or jsonb_typeof(p_values) <> 'object' then
  raise exception 'Operación inválida' using errcode='22023';
 end if;
 -- Global import lock serializes duplicate/reference checks across rows.
 perform pg_advisory_xact_lock(hashtext('kiosko_admin_import'));
 select * into r from public.ki_import_rows where id=p_row for update;
 if not found then raise exception 'Fila no encontrada' using errcode='22023'; end if;
 if r.version <> p_version then raise exception 'La fila cambió; actualice antes de guardar' using errcode='40001'; end if;
 if r.status='applied' then raise exception 'La fila ya fue incorporada' using errcode='22023'; end if;
 old_values := coalesce(r.reviewed_values,r.normalized_values);
 if length(trim(coalesce(p_values->>'review_note',''))) = 0 then
  raise exception 'Escriba una nota de revisión' using errcode='22023';
 end if;

 if p_action='apply' then
  if p_values->>'identity_pending_ack' is distinct from 'true' then
   raise exception 'Confirme que la incorporación no verifica identidades ni habilita cuentas' using errcode='22023';
  end if;
  foreach k in array array['contract_reference','starts_on','property_code','address','owner_name','tenant_name','rent','administration'] loop
   if length(trim(coalesce(p_values->>k,'')))=0 then
    raise exception 'Campo requerido: %',k using errcode='22023';
   end if;
  end loop;
  if coalesce(p_values->>'rent','') !~ '^[0-9]+(\.[0-9]{1,2})?$' or coalesce(p_values->>'administration','') !~ '^[0-9]+(\.[0-9]{1,2})?$' then
   raise exception 'Canon y administración deben ser importes no negativos con hasta dos decimales' using errcode='22023';
  end if;
  amount := (p_values->>'rent')::numeric; fee := (p_values->>'administration')::numeric;
  start_date := (p_values->>'starts_on')::date;
  if to_char(start_date,'YYYY-MM-DD') <> p_values->>'starts_on' then raise exception 'Fecha inválida' using errcode='22023'; end if;
  if nullif(p_values->>'area_m2','') is not null then area := (p_values->>'area_m2')::numeric; end if;
  if nullif(p_values->>'bedrooms','') is not null then rooms := (p_values->>'bedrooms')::integer; end if;
  if nullif(p_values->>'bathrooms','') is not null then baths := (p_values->>'bathrooms')::integer; end if;
  -- Repeated references require an explicit reviewed decision, even after editing.
  if exists (select 1 from jsonb_array_elements(r.validation_errors) e where e->>'code'='repeated_contract_reference')
   or exists (select 1 from public.ki_contracts where external_reference=trim(p_values->>'contract_reference'))
   or exists (select 1 from public.ki_import_rows s where s.id<>r.id and s.batch_id=r.batch_id
    and coalesce(s.reviewed_values->>'contract_reference',s.normalized_values->'contract'->>'external_reference')=trim(p_values->>'contract_reference')) then
   if p_values->>'duplicates_ack' is distinct from 'true' then
    raise exception 'Revise la referencia repetida y confirme la decisión en la nota' using errcode='22023';
   end if;
  end if;
  if exists (select 1 from public.ki_properties where external_code=trim(p_values->>'property_code')) then
   raise exception 'El código de inmueble ya existe. Revise la fila; no se fusiona automáticamente' using errcode='23505';
  end if;
  -- Identity selection is explicit: never deduplicate by name or email.
  foreach k in array array['owner','tenant'] loop
   existing_id := nullif(p_values->>(k||'_id'),'')::uuid;
   if existing_id is not null then
    select id into person_id from public.ki_clients where id=existing_id and status<>'inactive';
    if not found then raise exception 'Persona seleccionada no disponible' using errcode='22023'; end if;
   else
    person := jsonb_build_object('name',trim(p_values->>(k||'_name')),
     'document_type',nullif(trim(p_values->>(k||'_document_type')),''),
     'document_number',nullif(trim(p_values->>(k||'_document_number')),''),
     'email',nullif(lower(trim(p_values->>(k||'_email'))),''),
     'phone',nullif(trim(p_values->>(k||'_phone')),''));
    if (person->>'document_type' is null) <> (person->>'document_number' is null) then
     raise exception 'Complete tipo y número de documento, o deje ambos vacíos' using errcode='22023';
    end if;
    if person->>'email' is not null and person->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
     raise exception 'Correo inválido para %',k using errcode='22023';
    end if;
    if person->>'phone' is not null and person->>'phone' !~ '^\+?[0-9]{7,15}$' then
     raise exception 'Teléfono inválido para %',k using errcode='22023';
    end if;
    insert into public.ki_clients(full_name,document_type,document_number,email,phone,status)
     values(person->>'name',person->>'document_type',person->>'document_number',person->>'email',person->>'phone','pending')
     returning id into person_id;
   end if;
   if k='owner' then owner_id:=person_id; else tenant_id:=person_id; end if;
  end loop;

  contract_id := nullif(p_values->>'contract_id','')::uuid;
  if contract_id is not null then
   if not exists (select 1 from public.ki_contracts c where c.id=contract_id and c.status<>'ended'
    and c.external_reference=trim(p_values->>'contract_reference') and c.rent=amount and c.administration=fee and c.starts_on=start_date
    and c.insurance_provider is not distinct from nullif(trim(p_values->>'insurance_provider'),'')) then
    raise exception 'El contrato elegido no coincide en referencia, importes, fecha o seguro' using errcode='22023';
   end if;
  else
   if exists (select 1 from public.ki_contracts where external_reference=trim(p_values->>'contract_reference')) then
    raise exception 'Seleccione el contrato existente o corrija la referencia' using errcode='23505';
   end if;
   insert into public.ki_contracts(external_reference,starts_on,rent,administration,insurance_provider,status)
    values(trim(p_values->>'contract_reference'),start_date,amount,fee,nullif(trim(p_values->>'insurance_provider'),''),'pending') returning id into contract_id;
  end if;
  insert into public.ki_properties(external_code,address,building_name,unit_label,area_m2,bedrooms,bathrooms,parking_reference,status)
   values(trim(p_values->>'property_code'),trim(p_values->>'address'),nullif(trim(p_values->>'building_name'),''),nullif(trim(p_values->>'unit_label'),''),area,rooms,baths,nullif(trim(p_values->>'parking_reference'),''),'pending') returning id into property_id;
  insert into public.ki_property_owners(property_id,client_id) values(property_id,owner_id);
  insert into public.ki_contract_properties(contract_id,property_id) values(contract_id,property_id);
  insert into public.ki_contract_participants(contract_id,client_id,participant_role) values(contract_id,tenant_id,'tenant') on conflict do nothing;
  result := jsonb_build_object('owner_id',owner_id,'tenant_id',tenant_id,'property_id',property_id,'contract_id',contract_id);
 end if;

 update public.ki_import_rows set reviewed_values=p_values,version=version+1,reviewed_by=p_actor,reviewed_at=now(),
  status=case p_action when 'apply' then 'applied' when 'reject' then 'rejected' else 'pending' end,
  applied_entities=result where id=p_row;
 insert into public.ki_import_audit(row_id,actor_id,action,previous_values,submitted_values,entities)
  values(p_row,p_actor,p_action,old_values,p_values,result);
 update public.ki_import_batches set status=case when exists(select 1 from public.ki_import_rows where batch_id=r.batch_id and status in ('pending','approved')) then 'staged'
  when exists(select 1 from public.ki_import_rows where batch_id=r.batch_id and status='applied') then 'applied' else 'reviewed' end where id=r.batch_id;
 return jsonb_build_object('status',case p_action when 'apply' then 'applied' when 'reject' then 'rejected' else 'pending' end,'version',r.version+1,'entities',result);
end;
$$;
revoke execute on function public.ki_admin_require(uuid),public.ki_admin_list(uuid),public.ki_admin_review(uuid,uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.ki_admin_require(uuid),public.ki_admin_list(uuid),public.ki_admin_review(uuid,uuid,integer,text,jsonb) to service_role;
