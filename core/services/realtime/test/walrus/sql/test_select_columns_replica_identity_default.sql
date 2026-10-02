/*
Tests that replica identity DEFAULT combined with selected_columns is graceful:
- WAL identity only contains PK columns (not full row), so old_record has only the PK
- selected_columns requesting non-identity columns behaves gracefully on UPDATE and DELETE
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    body text,
    extra text
);

-- No replica identity full: uses DEFAULT (identity = PK only)

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

insert into public.notes(id, body, extra) values (1, 'old body', 'extra data');

-- UPDATE: old_record should only have the PK (body not in WAL identity)
select clear_wal();
update public.notes set body = 'new body', extra = 'new extra' where id = 1;

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;

-- DELETE: old_record should only have the PK (body not in WAL identity)
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
