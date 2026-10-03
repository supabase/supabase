/*
Tests that a filter on a column not in selected_columns still works correctly:
- The filter is evaluated against WAL columns (all columns), not selected_columns
- The output record still only contains selected_columns (+ PKs)
- A non-matching filter correctly suppresses the subscription
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text,
    extra text
);

-- Filter on `extra` but only select `body`
insert into realtime.subscription(subscription_id, entity, claims, selected_columns, filters)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    array['body'],
    array[('extra', 'eq', 'match', false)::realtime.user_defined_filter];

-- Matching row: filter on extra matches, but extra not in output
select clear_wal();
insert into public.notes(id, body, extra) values (1, 'note body', 'match');

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;

-- Non-matching row: filter on extra does not match, subscription_ids should be empty
select clear_wal();
insert into public.notes(id, body, extra) values (2, 'other body', 'no match');

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
