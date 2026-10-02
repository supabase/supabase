/*
    Test that only tables in the publication are selected by the polling_query view
*/
select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    user_id uuid
);

create table public.not_in_pub(
    id int primary key
);

drop publication supabase_realtime;

create publication
    supabase_realtime
for table
    public.notes
with (
    publish = 'insert,update,delete'
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

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1),
    'public.not_in_pub',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    );



select clear_wal();
insert into public.notes(id) values (1);
insert into public.not_in_pub(id) values (1);

select pubname, schemaname, tablename, attnames from pg_publication_tables;


select
    jsonb_pretty(wal - 'commit_timestamp'),
    is_rls_enabled,
    subscription_ids,
    errors
from
    polling_query;


drop table public.not_in_pub;
drop table public.notes;
truncate table realtime.subscription;
drop publication supabase_realtime;
