/*
Tests that, regtypes that require quoting are handled without exception
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);


create type "Color" as enum ('RED', 'YELLOW', 'GREEN');

create table public.notes(
    id int primary key,
    primary_color "Color"
);


create policy rls_color_is_red
on public.notes
to authenticated
using (primary_color = 'RED');

alter table public.notes enable row level security;


insert into realtime.subscription(subscription_id, entity, claims, filters)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'sub', seed_uuid(2)::text
    ),
    array[('primary_color', 'eq', 'RED', false)::realtime.user_defined_filter];

insert into public.notes(id, primary_color)
values
    (1, 'RED'),   -- matches filter
    (2, 'GREEN'); -- does not match filter

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
