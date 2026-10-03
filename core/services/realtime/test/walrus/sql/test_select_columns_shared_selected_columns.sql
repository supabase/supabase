/*
Tests that two subscribers sharing the same selected_columns receive a single
payload with both subscription IDs
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text,
    extra text
);

-- Both subscribers want the same columns
insert into realtime.subscription(subscription_id, entity, claims, selected_columns)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    array['body'];

insert into realtime.subscription(subscription_id, entity, claims, selected_columns)
select
    seed_uuid(2),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(2)::text
    ),
    array['body'];

select clear_wal();
insert into public.notes(id, body, extra) values (1, 'take out trash', 'extra data');

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
