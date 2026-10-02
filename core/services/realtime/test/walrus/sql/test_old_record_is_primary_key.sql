/*
    Test that the "old_record" key for updates (and deletes) contains primary key info

*/
select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    pk1 int,
    pk2 char,
    body text,
    primary key (pk1, pk2)
);


insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    );

insert into public.notes(pk1, pk2, body) values (1, 'a', 'take out trash');
select clear_wal();
update public.notes set pk1 =1;

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
