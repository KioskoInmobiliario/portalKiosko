-- Pending requests are independent of clients, Auth users and properties.
begin;
create table public.ki_registration_requests (
 id uuid primary key default gen_random_uuid(),
 role text not null check(role in ('propietario','inquilino')),
 full_name text not null check(length(full_name) between 3 and 150),
 email text not null check(length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 document_type text not null check(document_type in ('CC','CE','PAS','NIT','PPT')),
 document_number text not null check(document_number ~ '^[A-Za-z0-9.-]{4,30}$'),
 phone text not null check(phone ~ '^[+0-9() .-]{7,25}$'),
 status text not null default 'pending' check(status in ('pending','reviewed','archived')),
 consent_version text not null default 'registro-v1',
 created_at timestamptz not null default now(),
 unique(role,document_type,document_number,email)
);
create index ki_registration_requests_created_idx on public.ki_registration_requests(created_at desc);
alter table public.ki_registration_requests enable row level security;
revoke all on public.ki_registration_requests from public,anon,authenticated;
grant select,insert on public.ki_registration_requests to service_role;
create function public.ki_registration_submit(p_values jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if p_values->>'consent' is distinct from 'true' then raise exception 'Debes autorizar el uso de los datos para revisar tu registro' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtext('ki_registration_submit'));
 if (select count(*) from public.ki_registration_requests where created_at>now()-interval '1 hour')>=1000 then raise exception 'Intenta de nuevo más tarde' using errcode='54000';end if;
 -- Repeated submissions neither overwrite prior requests nor reveal matches.
 insert into public.ki_registration_requests(role,full_name,email,document_type,document_number,phone)
 values(p_values->>'role',btrim(p_values->>'full_name'),lower(btrim(p_values->>'email')),p_values->>'document_type',upper(btrim(p_values->>'document_number')),btrim(p_values->>'phone'))
 on conflict(role,document_type,document_number,email) do nothing;
 return jsonb_build_object('received',true);
end;$$;
create function public.ki_admin_registrations(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 perform public.ki_admin_require(p_actor);
 return jsonb_build_object('requests',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from (select id,role,full_name,email,document_type,document_number,phone,status,created_at from public.ki_registration_requests order by created_at desc limit 500) r),'[]'::jsonb));
end;$$;
revoke all on function public.ki_registration_submit(jsonb),public.ki_admin_registrations(uuid) from public,anon,authenticated;
grant execute on function public.ki_registration_submit(jsonb),public.ki_admin_registrations(uuid) to service_role;
commit;
