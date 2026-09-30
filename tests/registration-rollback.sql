begin;
do $$
declare v jsonb:='{"role":"propietario","full_name":"PRUEBA REGISTRO","email":"registro-rollback@example.invalid","document_type":"CC","document_number":"TESTREG1234","phone":"3000000000","consent":true}';n integer;
begin
 perform public.ki_registration_submit(v);
 perform public.ki_registration_submit(v);
 select count(*) into n from public.ki_registration_requests where email='registro-rollback@example.invalid';
 if n<>1 then raise exception 'Duplicate request inserted';end if;
 if has_table_privilege('anon','public.ki_registration_requests','SELECT') or has_table_privilege('authenticated','public.ki_registration_requests','SELECT') or has_function_privilege('anon','public.ki_registration_submit(jsonb)','EXECUTE') or has_function_privilege('authenticated','public.ki_admin_registrations(uuid)','EXECUTE') then raise exception 'Unexpected public access';end if;
 begin perform public.ki_registration_submit(v||'{"consent":false}'::jsonb);raise exception 'Missing consent accepted';exception when sqlstate '22023' then null;end;
 begin perform public.ki_admin_registrations('00000000-0000-4000-8000-000000000001');raise exception 'Non admin read allowed';exception when sqlstate '42501' then null;end;
 if jsonb_array_length(public.ki_admin_registrations((select user_id from public.ki_admins where active order by created_at limit 1))->'requests')<1 then raise exception 'Admin read failed';end if;
end;$$;
rollback;
