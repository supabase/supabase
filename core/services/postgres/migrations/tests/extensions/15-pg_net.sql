BEGIN;
-- create net extension as supabase_admin
create extension if not exists pg_net with schema "extensions";

-- \ir migrations/db/init-scripts/00000000000003-post-setup.sql
grant usage on schema net TO postgres, anon, authenticated, service_role;
alter function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) security definer;
alter function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) security definer;
alter function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
alter function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
revoke all on function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) from public;
revoke all on function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) from public;
grant execute on function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO postgres, anon, authenticated, service_role;
grant execute on function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO postgres, anon, authenticated, service_role;

-- postgres role should have access
set local role postgres;
select net.http_get('http://localhost', null::jsonb, null::jsonb, 100);

-- authenticated role should have access
set local role authenticated;
select net.http_get('http://localhost', null::jsonb, null::jsonb, 100);
ROLLBACK;
