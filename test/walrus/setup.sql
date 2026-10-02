-- Environment the WALRUS regress suite expects on top of a tenant database

-- The image creates `supabase_realtime` empty; the suite (and any project with
-- "enable realtime for all tables") expects it to cover every table.
drop publication if exists supabase_realtime;
create publication supabase_realtime for all tables;

/*
    `auth.uid()` has to read `request.jwt.claims`.

    Claims reach a policy through two different conventions: `request.jwt.claim.sub`
    (singular, one GUC per claim -- the legacy PostgREST style) and `request.jwt.claims`
    (plural, the whole JSON blob). `realtime.apply_rls` sets only the plural one.

    The image is only the base layer. Its init script
    `init-scripts/00000000000001-auth-schema.sql` defines the singular-only `auth.uid()`
*/
create or replace function auth.uid() returns uuid as $$
    select
        coalesce(
            nullif(current_setting('request.jwt.claim.sub', true), ''),
            nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
        )::uuid;
$$ language sql stable;
