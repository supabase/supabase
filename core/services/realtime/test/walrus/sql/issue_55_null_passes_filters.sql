select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id serial primary key,
    page_id int
);

insert into realtime.subscription(subscription_id, entity, claims, filters)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    array[('page_id', 'eq', '5', false)::realtime.user_defined_filter];

select clear_wal();


-- Expect 0 subscriptions: filters do not match: 5 <> 1
insert into public.notes(page_id) values (1);
select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;



-- Expect 1 subscription: filters do match 5 = 5
insert into public.notes(page_id) values (5);
select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;



-- Expect 0 subscriptions: filters do match 5 <> null
insert into public.notes(page_id) values (null);
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
