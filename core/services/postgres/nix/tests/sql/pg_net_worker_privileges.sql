-- Regression test for a privilege-escalation vulnerability in pg_net's background
-- worker. See ansible/files/postgresql_config/conf.d/pg_net.conf, which sets
-- pg_net.username = 'postgres' to fix it.
--
-- pg_net.username controls which role the background worker uses to drain
-- net.http_request_queue and write to net._http_response. When unset, the worker
-- connects as the bootstrap superuser -- supabase_admin on this platform, a true
-- superuser.
--
-- pg_net's own install script grants ALL privileges (which includes TRIGGER) on
-- both of those tables to PUBLIC:
--   grant all on all tables in schema net to PUBLIC;
-- so literally any role -- including a `postgres` app user -- can attach
-- a trigger to them. Since a normal (non SECURITY DEFINER) trigger runs with the
-- privileges of whoever performs the triggering statement, a `postgres` user
-- could make such a trigger run arbitrary SQL with the pg_net worker's privileges
-- the next time it processed a queued request.
--
-- This test plants such a trigger as `postgres` and has it record which role
-- and privilege level it actually ran with, confirming the worker's DML now runs
-- as the unprivileged `postgres` role instead of the superuser `supabase_admin`.

create table public.pg_net_privesc_log (
  recorded_role name,
  recorded_is_superuser bool
);

grant insert on public.pg_net_privesc_log to public;

create function public.pg_net_privesc_trigger() returns trigger
language plpgsql
security invoker
as $$
begin
  -- records the privileges of whoever actually performed the triggering
  -- statement -- i.e. the pg_net worker, not whoever created this trigger
  insert into public.pg_net_privesc_log (recorded_role, recorded_is_superuser)
  values (current_user, (select rolsuper from pg_roles where rolname = current_user));
  return null;
end;
$$;

grant execute on function public.pg_net_privesc_trigger() to public;

set session authorization postgres;

create trigger pg_net_privesc
after insert on net._http_response
for each row execute function public.pg_net_privesc_trigger();

select net.http_get(
  'http://localhost:' || (select value from test_config where key = 'http_mock_port') || '/get'
) is not null as request_queued;

reset session authorization;

-- give the background worker time to drain the queue and process the response
do $$
declare
  i int := 0;
begin
  while (select count(*) from public.pg_net_privesc_log) = 0 and i < 40 loop
    perform pg_sleep(0.25);
    i := i + 1;
  end loop;
end;
$$;

-- the pg_net worker must have run the trigger as the unprivileged `postgres`
-- role, not the superuser `supabase_admin`
select recorded_role, recorded_is_superuser from public.pg_net_privesc_log;

-- cleanup
drop trigger if exists pg_net_privesc on net._http_response;
drop function if exists public.pg_net_privesc_trigger();
drop table public.pg_net_privesc_log;
