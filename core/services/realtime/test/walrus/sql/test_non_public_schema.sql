select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create schema dev;

create table dev.notes(
    id int primary key
);

grant usage on schema dev to authenticated;
grant select on dev.notes to authenticated;

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1),
    'dev.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    );

select clear_wal();
insert into dev.notes(id) values (1);

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;


drop table dev.notes;
select pg_drop_replication_slot('realtime');
truncate table realtime.subscription;
