select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body1 text,
    body2 text
);
alter table public.notes replica identity full;

-- Disable compression to force values to be TOASTed
alter table public.notes alter column body2 set storage external;
alter table public.notes alter column body1 set storage external;

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(2)::text
    );

insert into public.notes(id, body1, body2)
values (1, repeat('1', 2 *  1024), repeat('2', 2 *  1024));
select clear_wal();

update public.notes set body1 = 'new';

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
