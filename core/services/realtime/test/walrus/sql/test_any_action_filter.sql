select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text
);

insert into realtime.subscription(subscription_id, entity, claims, action_filter)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    '*';

-- INSERT, UPDATE and DELETE and record everything
insert into public.notes(id, body) values (1, 'take out trash');

update public.notes set id=2;

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
