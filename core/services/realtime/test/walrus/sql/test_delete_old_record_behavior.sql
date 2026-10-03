/*

*/
select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    pk1 int primary key,
    body text
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

-- Option 1:
-- Replica Identity Full: false
-- Row Level Security   : false

-- Expect:
-- old_record contains only primary key info because only pkey info available in WAL
alter table public.notes replica identity default;
alter table public.notes disable row level security;
insert into public.notes(pk1, body) values (1, 'take out trash');
select clear_wal();
delete from public.notes where pk1=1;

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;

-- Option 2:
-- Replica Identity Full: false
-- Row Level Security   : true

-- Expect:
-- old_record contains only primary key info because only pkey info available in WAL
alter table public.notes replica identity default;
alter table public.notes enable row level security;
insert into public.notes(pk1, body) values (1, 'take out trash');
select clear_wal();
delete from public.notes where pk1=1;

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;


-- Option 3:
-- Replica Identity Full: true
-- Row Level Security   : false

-- Expect:
-- old_record contains all columns becaues they're all available and there is no RLS so info is public
alter table public.notes replica identity full;
alter table public.notes disable row level security;

insert into public.notes(pk1, body) values (1, 'take out trash');
select clear_wal();
delete from public.notes where pk1=1;

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;

-- Option 4:
-- Replica Identity Full: true
-- Row Level Security   : true

-- Expect:
-- old_record contains only primary key info because we can not enforce RLS on deletes and some columns might be private
alter table public.notes replica identity full;
alter table public.notes enable row level security;
insert into public.notes(pk1, body) values (1, 'take out trash');
select clear_wal();
delete from public.notes where pk1=1;

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;

select pg_drop_replication_slot('realtime');
drop table public.notes;
truncate table realtime.subscription;
