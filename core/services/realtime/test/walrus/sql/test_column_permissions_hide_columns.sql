/*
Tests that, when a role does not have select access to a column, it is omitted
from realtime output

In this case, we omit the "body" column
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
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'sub', seed_uuid(2)::text
    );


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
