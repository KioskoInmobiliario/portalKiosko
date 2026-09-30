-- Synthetic fixtures only. The entire transaction is rolled back.
begin;
do $$
declare
 actor uuid := (select user_id from public.ki_admins where active order by created_at limit 1);
 owner_id uuid; tenant_id uuid; property_id uuid; contract_id uuid; batch_id uuid; test_row_id uuid; shared_row uuid;
 values_json jsonb; versions jsonb; entities jsonb; old_counts jsonb; new_counts jsonb;
begin
 insert into public.ki_clients(full_name) values('__TEST_OWNER__') returning id into owner_id;
 insert into public.ki_clients(full_name) values('__TEST_TENANT__') returning id into tenant_id;
 insert into public.ki_properties(external_code,address) values('__TEST_PROPERTY__','Synthetic address') returning id into property_id;
 insert into public.ki_contracts(external_reference,starts_on,rent,administration) values('__TEST_CONTRACT__','2026-09-01',1000,100) returning id into contract_id;
 insert into public.ki_property_owners values(property_id,owner_id,null,null);
 insert into public.ki_contract_properties values(contract_id,property_id);
 insert into public.ki_contract_participants values(contract_id,tenant_id,'tenant');
 insert into public.ki_import_batches(source_filename,source_sha256) values('__TEST_ROLLBACK__',repeat('0',64)) returning id into batch_id;
 entities:=jsonb_build_object('owner_id',owner_id,'tenant_id',tenant_id,'property_id',property_id,'contract_id',contract_id);
 insert into public.ki_import_rows(batch_id,sheet_name,source_row,original_values,normalized_values,status,applied_entities)
 values(batch_id,'Synthetic',1,'{}','{}','applied',entities) returning id into test_row_id;
 insert into public.ki_import_rows(batch_id,sheet_name,source_row,original_values,normalized_values,status,applied_entities)
 values(batch_id,'Synthetic',2,'{}','{}','applied',entities) returning id into shared_row;
 select j->'reviewed_values',j->'entity_versions' into values_json,versions
 from jsonb_array_elements(public.ki_admin_edit_list(actor)->'rows') j where j->>'id'=test_row_id::text;
 if values_json->>'owner_id'<>owner_id::text or values_json->>'rent'<>'1000.00' then raise exception 'Current entities not loaded'; end if;
 values_json:=values_json||jsonb_build_object('rent','1250.50','administration','150','owner_email','owner@example.invalid','review_note','Synthetic update test');
 perform public.ki_admin_update(actor,test_row_id,0,values_json,versions);
 if (select monthly_total from public.ki_contracts where id=contract_id)<>1400.50 then raise exception 'Amounts not updated'; end if;
 if (select email from public.ki_clients where id=owner_id)<>'owner@example.invalid' then raise exception 'Client not updated'; end if;
 begin
  perform public.ki_admin_update(actor,shared_row,0,values_json,versions);
  raise exception 'Stale shared revision accepted';
 exception when serialization_failure then null; end;
 begin
  perform public.ki_admin_update(actor,test_row_id,0,values_json,versions);
  raise exception 'Stale row accepted';
 exception when serialization_failure then null; end;
 select j->'entity_versions' into versions from jsonb_array_elements(public.ki_admin_edit_list(actor)->'rows') j where j->>'id'=test_row_id::text;
 begin
  perform public.ki_admin_update(actor,test_row_id,1,values_json||'{"tenant_email":"invalid"}',versions);
  raise exception 'Invalid email accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.ki_admin_update(gen_random_uuid(),test_row_id,1,values_json,versions);
  raise exception 'Unauthorized actor accepted';
 exception when insufficient_privilege then null; end;
 if (select count(*) from public.ki_import_audit a where a.row_id=test_row_id and action='update')<>1 then raise exception 'Audit missing or invalid update persisted'; end if;
 if exists(select 1 from information_schema.routine_privileges where routine_name in ('ki_admin_edit_list','ki_admin_update') and grantee in ('PUBLIC','anon','authenticated') and privilege_type='EXECUTE') then raise exception 'RPC publicly executable'; end if;
end;
$$;
rollback;
