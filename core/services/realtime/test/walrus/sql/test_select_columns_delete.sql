/*
Tests that selected_columns filters old_record on DELETE:
- PKs are always included
- With RLS disabled and replica identity full, selected columns appear in old_record
- Columns not in selected_columns are excluded
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text,
    extra text
);

alter table public.notes replica identity full;

insert into realtime.subscription(subscription_id, entity, claims, selected_columns)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    array['body'];

insert into public.notes(id, body, extra) values (1, 'take out trash', 'extra data');

select clear_wal();
delete from public.notes where id = 1;

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
