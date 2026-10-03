/*
Regression test for the role leak in apply_rls subscription FOR loop

See supabase/realtime#2001 and `walrus_migration_0016_fix_apply_rls_role_leak.sql`
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create role role_without_grants nologin noinherit;

create table public.notes(
    id int primary key
);

grant select (id) on public.notes to role_without_grants;

create policy rls_note_select on public.notes to role_without_grants using (true);

alter table public.notes enable row level security;

-- Revoke from public so role_without_grants does not inherit it.
revoke execute on function realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean) from public;

-- 11 subscriptions force a second batch fetch; <=10 fits in one batch and won't reproduce the bug.
insert into realtime.subscription(subscription_id, entity, claims, filters)
select
    seed_uuid(a.ix),
    'public.notes',
    jsonb_build_object(
        'role', 'role_without_grants',
        'email', 'example@example.com',
        'sub', seed_uuid(a.ix)::text
    ),
    array[('id', 'eq', '1', false)::realtime.user_defined_filter]
from
    generate_series(1, 11) a(ix);

select clear_wal();
insert into public.notes(id) values (1);

-- All 11 subscribers should match with no errors.
select
    is_rls_enabled,
    array_length(subscription_ids, 1) as subscriber_count,
    errors
from
   walrus;

grant execute on function realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean) to public;
drop table public.notes;
drop role role_without_grants;
select pg_drop_replication_slot('realtime');
truncate table realtime.subscription;
