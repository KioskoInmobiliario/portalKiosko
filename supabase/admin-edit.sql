-- Apply through the administrative connection. No customer data in this file.
begin;
alter table public.ki_clients add column revision integer not null default 0;
alter table public.ki_properties add column revision integer not null default 0;
alter table public.ki_contracts add column revision integer not null default 0;
create function public.ki_bump_revision() returns trigger
language plpgsql security invoker set search_path='' as $$
begin new.revision:=old.revision+1; return new; end; $$;
create trigger ki_clients_revision before update on public.ki_clients for each row execute function public.ki_bump_revision();
create trigger ki_properties_revision before update on public.ki_properties for each row execute function public.ki_bump_revision();
create trigger ki_contracts_revision before update on public.ki_contracts for each row execute function public.ki_bump_revision();
alter table public.ki_import_audit drop constraint ki_import_audit_action_check;
alter table public.ki_import_audit add constraint ki_import_audit_action_check check(action in ('save','reject','apply','update'));

create function public.ki_admin_edit_list(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare data jsonb;
begin
 data:=public.ki_admin_list(p_actor);
 return jsonb_set(data,'{rows}',coalesce((
  select jsonb_agg(to_jsonb(r)||case when r.status='applied' then jsonb_build_object(
   'entity_versions',jsonb_build_object('owner',o.revision,'tenant',t.revision,'property',p.revision,'contract',c.revision),
   'reviewed_values',coalesce(r.reviewed_values,'{}'::jsonb)||jsonb_build_object(
    'owner_id',o.id,'tenant_id',t.id,'contract_id',c.id,
    'owner_name',o.full_name,'owner_document_type',coalesce(o.document_type,''),'owner_document_number',coalesce(o.document_number,''),'owner_email',coalesce(o.email,''),'owner_phone',coalesce(o.phone,''),
    'tenant_name',t.full_name,'tenant_document_type',coalesce(t.document_type,''),'tenant_document_number',coalesce(t.document_number,''),'tenant_email',coalesce(t.email,''),'tenant_phone',coalesce(t.phone,''),
    'property_code',coalesce(p.external_code,''),'address',p.address,'building_name',coalesce(p.building_name,''),'unit_label',coalesce(p.unit_label,''),
    'area_m2',coalesce(p.area_m2::text,''),'bedrooms',coalesce(p.bedrooms::text,''),'bathrooms',coalesce(p.bathrooms::text,''),'parking_reference',coalesce(p.parking_reference,''),
    'contract_reference',c.external_reference,'rent',c.rent::text,'administration',c.administration::text,'starts_on',coalesce(c.starts_on::text,''),'insurance_provider',coalesce(c.insurance_provider,'')))
   else '{}'::jsonb end order by r.source_row)
  from public.ki_import_rows r
  left join public.ki_clients o on o.id=(r.applied_entities->>'owner_id')::uuid
  left join public.ki_clients t on t.id=(r.applied_entities->>'tenant_id')::uuid
  left join public.ki_properties p on p.id=(r.applied_entities->>'property_id')::uuid
  left join public.ki_contracts c on c.id=(r.applied_entities->>'contract_id')::uuid
 ),'[]'::jsonb));
end; $$;

create function public.ki_admin_update(p_actor uuid,p_row uuid,p_version integer,p_values jsonb,p_revisions jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
 r public.ki_import_rows%rowtype; p public.ki_properties%rowtype; c public.ki_contracts%rowtype;
 o public.ki_clients%rowtype; t public.ki_clients%rowtype;
 old_values jsonb; current_versions jsonb; k text; start_date date; amount numeric; fee numeric;
begin
 perform public.ki_admin_require(p_actor);
 if jsonb_typeof(p_values) is distinct from 'object' or jsonb_typeof(p_revisions) is distinct from 'object' then raise exception 'Solicitud inválida' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtext('kiosko_admin_import'));
 select * into r from public.ki_import_rows where id=p_row for update;
 if not found or r.status<>'applied' then raise exception 'Seleccione una fila incorporada' using errcode='22023'; end if;
 if r.version<>p_version then raise exception 'La fila cambió; actualice antes de guardar' using errcode='40001'; end if;
 select * into p from public.ki_properties where id=(r.applied_entities->>'property_id')::uuid for update;
 if not found then raise exception 'Inmueble no disponible' using errcode='22023'; end if;
 select * into c from public.ki_contracts where id=(r.applied_entities->>'contract_id')::uuid for update;
 if not found then raise exception 'Contrato no disponible' using errcode='22023'; end if;
 -- Stable lock order for clients shared across contracts.
 perform 1 from public.ki_clients where id in ((r.applied_entities->>'owner_id')::uuid,(r.applied_entities->>'tenant_id')::uuid) order by id for update;
 select * into o from public.ki_clients where id=(r.applied_entities->>'owner_id')::uuid;
 if not found then raise exception 'Propietario no disponible' using errcode='22023'; end if;
 select * into t from public.ki_clients where id=(r.applied_entities->>'tenant_id')::uuid;
 if not found then raise exception 'Inquilino no disponible' using errcode='22023'; end if;
 current_versions:=jsonb_build_object('owner',o.revision,'tenant',t.revision,'property',p.revision,'contract',c.revision);
 if current_versions<>p_revisions then raise exception 'Los registros cambiaron en otra revisión; actualice antes de guardar' using errcode='40001'; end if;
 if p_values->>'owner_id' is distinct from o.id::text or p_values->>'tenant_id' is distinct from t.id::text or p_values->>'contract_id' is distinct from c.id::text then
  raise exception 'Esta edición conserva las personas y el contrato vinculados' using errcode='22023';
 end if;
 foreach k in array array['contract_reference','starts_on','property_code','address','owner_name','tenant_name','rent','administration','review_note'] loop
  if length(trim(coalesce(p_values->>k,'')))=0 then raise exception 'Campo requerido: %',k using errcode='22023'; end if;
 end loop;
 if coalesce(p_values->>'rent','') !~ '^[0-9]+(\.[0-9]{1,2})?$' or coalesce(p_values->>'administration','') !~ '^[0-9]+(\.[0-9]{1,2})?$' then raise exception 'Importes inválidos' using errcode='22023'; end if;
 amount:=(p_values->>'rent')::numeric; fee:=(p_values->>'administration')::numeric;
 start_date:=(p_values->>'starts_on')::date;
 if to_char(start_date,'YYYY-MM-DD')<>p_values->>'starts_on' then raise exception 'Fecha inválida' using errcode='22023'; end if;
 if nullif(p_values->>'area_m2','') is not null and p_values->>'area_m2' !~ '^[0-9]+(\.[0-9]{1,2})?$' then raise exception 'Área inválida' using errcode='22023'; end if;
 foreach k in array array['bedrooms','bathrooms'] loop
  if nullif(p_values->>k,'') is not null and p_values->>k !~ '^[0-9]+$' then raise exception 'Habitaciones o baños inválidos' using errcode='22023'; end if;
 end loop;
 foreach k in array array['owner','tenant'] loop
  if (nullif(trim(p_values->>(k||'_document_type')),'') is null) <> (nullif(trim(p_values->>(k||'_document_number')),'') is null) then raise exception 'Complete tipo y número de documento' using errcode='22023'; end if;
  if nullif(trim(p_values->>(k||'_email')),'') is not null and p_values->>(k||'_email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Correo inválido' using errcode='22023'; end if;
  if nullif(trim(p_values->>(k||'_phone')),'') is not null and p_values->>(k||'_phone') !~ '^\+?[0-9]{7,15}$' then raise exception 'Teléfono inválido' using errcode='22023'; end if;
 end loop;
 if o.id=t.id and exists(select 1 from unnest(array['name','document_type','document_number','email','phone']) key where p_values->>('owner_'||key) is distinct from p_values->>('tenant_'||key)) then
  raise exception 'La misma persona debe conservar datos iguales en ambos perfiles' using errcode='22023';
 end if;
 if trim(p_values->>'contract_reference')<>c.external_reference and exists(select 1 from public.ki_contracts where id<>c.id and external_reference=trim(p_values->>'contract_reference')) then raise exception 'La referencia de contrato ya existe' using errcode='23505'; end if;
 old_values:=jsonb_build_object('property',to_jsonb(p),'contract',to_jsonb(c),'owner',to_jsonb(o),'tenant',to_jsonb(t));
 update public.ki_properties set external_code=trim(p_values->>'property_code'),address=trim(p_values->>'address'),building_name=nullif(trim(p_values->>'building_name'),''),unit_label=nullif(trim(p_values->>'unit_label'),''),area_m2=nullif(p_values->>'area_m2','')::numeric,bedrooms=nullif(p_values->>'bedrooms','')::integer,bathrooms=nullif(p_values->>'bathrooms','')::integer,parking_reference=nullif(trim(p_values->>'parking_reference'),'') where id=p.id;
 update public.ki_contracts set external_reference=trim(p_values->>'contract_reference'),starts_on=start_date,rent=amount,administration=fee,insurance_provider=nullif(trim(p_values->>'insurance_provider'),'') where id=c.id;
 update public.ki_clients set full_name=trim(p_values->>'owner_name'),document_type=nullif(trim(p_values->>'owner_document_type'),''),document_number=nullif(trim(p_values->>'owner_document_number'),''),email=nullif(lower(trim(p_values->>'owner_email')),''),phone=nullif(trim(p_values->>'owner_phone'),'') where id=o.id;
 if t.id<>o.id then
  update public.ki_clients set full_name=trim(p_values->>'tenant_name'),document_type=nullif(trim(p_values->>'tenant_document_type'),''),document_number=nullif(trim(p_values->>'tenant_document_number'),''),email=nullif(lower(trim(p_values->>'tenant_email')),''),phone=nullif(trim(p_values->>'tenant_phone'),'') where id=t.id;
 end if;
 update public.ki_import_rows set reviewed_values=p_values,version=version+1,reviewed_by=p_actor,reviewed_at=now() where id=r.id;
 insert into public.ki_import_audit(row_id,actor_id,action,previous_values,submitted_values,entities) values(r.id,p_actor,'update',old_values,p_values,r.applied_entities);
 return jsonb_build_object('status','applied','version',r.version+1,'entities',r.applied_entities);
end; $$;
revoke execute on function public.ki_bump_revision(),public.ki_admin_edit_list(uuid),public.ki_admin_update(uuid,uuid,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.ki_admin_edit_list(uuid),public.ki_admin_update(uuid,uuid,integer,jsonb,jsonb) to service_role;
commit;
