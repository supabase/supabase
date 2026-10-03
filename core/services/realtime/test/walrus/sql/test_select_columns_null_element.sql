/*
Tests what a NULL element inside selected_columns does.

walrus raised `selected_columns cannot contain null values.` here
(walrus_migration_0014). realtime has no such guard, deliberately: subscriptions only
reach this table through Subscriptions.parse_select/1, which drops every non-string
element before the insert, so a NULL can only arrive from a direct SQL write.

Without the guard `selected_col = any(col_names)` is NULL for a NULL element, so
`not NULL` never fires the `invalid column for select` branch, the subscription is
accepted, and the payload degrades to primary keys only. That is what this test pins.
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
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
    array[null]::text[];

select subscription_id, selected_columns from realtime.subscription;

select clear_wal();
insert into public.notes(id, body) values (1, 'take out trash');

-- `body` is dropped from the record: the NULL element selects nothing, so only the
-- primary key survives.
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
