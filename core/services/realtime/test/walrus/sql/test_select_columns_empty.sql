/*
Tests that subscribing with an empty selected_columns defaults to returning
only the primary key columns (rather than raising an exception)
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text,
    extra text
);

insert into realtime.subscription(subscription_id, entity, claims, selected_columns)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    '{}'::text[];

-- The empty array is preserved (not collapsed to NULL) so it stays distinct
-- from "all columns"
select selected_columns from realtime.subscription;

select clear_wal();
insert into public.notes(id, body, extra) values (1, 'take out trash', 'extra data');

-- Only the primary key (id) is present in record and columns
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
