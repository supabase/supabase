/*
Tests that selected_columns is applied when RLS allows the row:
- Subscriber has selected_columns = ARRAY['body']
- RLS policy permits the row for this subscriber
- Expected: record contains only PK (id) and selected_columns (body); is_rls_enabled = t
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    user_id uuid,
    body text,
    extra text
);

create policy rls_note_select
on public.notes
to authenticated
using (user_id = auth.uid());

alter table public.notes enable row level security;

insert into realtime.subscription(subscription_id, entity, claims, selected_columns)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text  -- should see result according to RLS
    ),
    array['body'];

select clear_wal();
insert into public.notes(id, user_id, body, extra) values (1, seed_uuid(1), 'take out trash', 'extra data');

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
