select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
);

insert into realtime.subscription(subscription_id, entity, claims, filters)
select
    seed_uuid(id),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(id)::text
    ),
    array[(column_name, op, value, false)::realtime.user_defined_filter]
from
    (
        values
            (1 , 'body', 'eq', 'bbb'),
            (2 , 'id', 'eq', '2')

    ) f(id, column_name, op, value);

select subscription_id, filters from realtime.subscription;

----------------------------------------------------------------------------------------
-- When Replica Identity is Not Full, only filters referencing the pkey are respected --
----------------------------------------------------------------------------------------

insert into public.notes(id, body)
values
    (1, 'bbb'),
    (2, 'ccc');

select clear_wal();

delete from public.notes;


select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;


----------------------------------------------------------------------------------------
-- When Replica Identity is Not Full, only filters referencing the pkey are respected --
----------------------------------------------------------------------------------------

alter table public.notes replica identity full;

insert into public.notes(id, body)
values
    (1, 'bbb'),
    (2, 'ccc');

select clear_wal();

delete from public.notes;


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
