select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
);

alter table public.notes replica identity full;

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
            (1 , 'body', 'in', array['aaa', 'bbb', 'ccc']::text),
            (2 , 'body', 'in', array['aaa', 'ccc']::text),
            (3 , 'body', 'in', array[]::text[]::text)

    ) f(id, column_name, op, value);


select clear_wal();
insert into public.notes(id, body) values (1, 'bbb');

delete from public.notes;

select subscription_id, filters from realtime.subscription;

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;

-- Confirm that filtering on `in` more than 100 entries throws an error
insert into realtime.subscription(subscription_id, entity, claims, filters)
select
    seed_uuid(6),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(6)::text
    ),
    array[('body', 'in', array[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], false)::realtime.user_defined_filter];

drop table public.notes;
select pg_drop_replication_slot('realtime');
truncate table realtime.subscription;
