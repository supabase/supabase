select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    identifier uuid
);

alter table public.notes replica identity full;

insert into realtime.subscription(subscription_id, entity, claims, filters)
select
    seed_uuid(5),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(6)::text
    ),
    array[(
        'identifier',
        'in',
        '{ace23052-568e-4951-acc8-fd510ec667f9,7057e8c3-c05f-4944-b9d9-05f8c45393d1}',
        false
    )::realtime.user_defined_filter];


select clear_wal();
insert into public.notes(id, identifier) values (1, 'ace23052-568e-4951-acc8-fd510ec667f9');
delete from public.notes;

select subscription_id, filters from realtime.subscription;

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
