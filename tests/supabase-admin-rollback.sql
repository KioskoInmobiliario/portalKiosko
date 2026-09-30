-- Integration test: run as postgres. Every test mutation is rolled back.
begin;
insert into auth.users(id,email) values(gen_random_uuid(),'kiosko-test-rollback@example.invalid');
insert into public.ki_admins(user_id) select id from auth.users where email='kiosko-test-rollback@example.invalid';
set local role service_role;
do $$
declare actor uuid; target_row uuid; v integer; d jsonb; result jsonb; count_before integer;
begin
 select user_id into actor from public.ki_admins where user_id=(select user_id from public.ki_admins order by created_at desc limit 1);
 select id,version into target_row,v from public.ki_import_rows where status='pending' order by source_row limit 1;
 d := '{"contract_reference":"KIOSKO-TEST-ROLLBACK","starts_on":"2026-09-01","property_code":"KIOSKO-TEST-ROLLBACK-P1","address":"Dirección de prueba","owner_name":"Propietario de prueba","tenant_name":"Inquilino de prueba","rent":"1000.50","administration":"100","review_note":"Prueba reversible de incorporación","identity_pending_ack":true,"duplicates_ack":true}'::jsonb;
 begin
  perform public.ki_admin_list(null);
  raise exception 'FAIL: unauthorized actor accepted';
 exception when insufficient_privilege then null; end;
 select count(*) into count_before from public.ki_clients;
 begin
  perform public.ki_admin_review(actor,target_row,v,'apply',jsonb_set(d,'{rent}','"-10"'));
  raise exception 'FAIL: negative amount accepted';
 exception when invalid_parameter_value then null; end;
 if (select count(*) from public.ki_clients)<>count_before then raise exception 'FAIL: partial write after invalid input'; end if;
 perform public.ki_admin_review(actor,target_row,v,'reject',d);
 perform public.ki_admin_review(actor,target_row,v+1,'save',d);
 begin
  perform public.ki_admin_review(actor,target_row,v,'save',d);
  raise exception 'FAIL: stale version accepted';
 exception when serialization_failure then null; end;
 result:=public.ki_admin_review(actor,target_row,v+2,'apply',d);
 if result->>'status'<>'applied' or (result->'entities'->>'property_id') is null then raise exception 'FAIL: no incorporated property'; end if;
 if not exists(select 1 from public.ki_contract_properties where property_id=(result->'entities'->>'property_id')::uuid and contract_id=(result->'entities'->>'contract_id')::uuid) then raise exception 'FAIL: missing contract property relationship'; end if;
 if not exists(select 1 from public.ki_property_owners where property_id=(result->'entities'->>'property_id')::uuid and client_id=(result->'entities'->>'owner_id')::uuid) then raise exception 'FAIL: missing ownership'; end if;
 begin
  perform public.ki_admin_review(actor,target_row,v+3,'apply',d);
  raise exception 'FAIL: duplicate application accepted';
 exception when invalid_parameter_value then null; end;
 if (select count(*) from public.ki_import_audit where row_id=target_row and actor_id=actor)<>3 then raise exception 'FAIL: audit count'; end if;
 if exists(select 1 from public.ki_account_links where client_id in ((result->'entities'->>'owner_id')::uuid,(result->'entities'->>'tenant_id')::uuid)) then raise exception 'FAIL: activated account'; end if;
 if exists(select 1 from public.ki_clients where id in ((result->'entities'->>'owner_id')::uuid,(result->'entities'->>'tenant_id')::uuid) and status<>'pending') then raise exception 'FAIL: verified identity'; end if;
end;
$$;
reset role;
rollback;
select count(*)::integer as pending_rows from public.ki_import_rows where status='pending';
