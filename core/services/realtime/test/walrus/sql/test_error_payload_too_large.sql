/*
Tests that an error is thrown when attempting to subscribe to a table the role can not select from
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
);

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(2)::text
    );

insert into public.notes(id) values (1);
select clear_wal();
update public.notes set body = repeat('a', 5 * 1024 * 1024);

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
