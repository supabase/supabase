/*
Tests that when multiple roles are subscribed to the same table, a WAL record
is split into 2 rows so permissions can be handled independently

The authenticated role has limited access to `public.notes` and has one field
redacted in the output.
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
);

revoke select on public.notes from authenticated;
grant select (id) on public.notes to authenticated;


insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(a.ix::int),
    'public.notes',
    jsonb_build_object(
        'role', role_name,
        'email', 'example@example.com',
        'sub', seed_uuid(3)::text
    )
from
    unnest(
        array['authenticated', 'postgres']
    ) with ordinality a(role_name, ix);


insert into public.notes(id, body) values (1, 'hello');

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;


drop table public.notes;
select pg_drop_replication_slot('realtime');
truncate table realtime.subscription;
