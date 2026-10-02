/*
    Tests that subscriber is omitted when record not visible to them in the RLS policy
*/

select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);

create table public.notes(
    id int primary key,
    user_id uuid
);

create policy rls_note_select
on public.notes
to authenticated
using (user_id = auth.uid());

alter table public.notes enable row level security;

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1), -- matches for convienence, not required,
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text  -- should see result according to RLS
    );

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(2), -- matches for convienence, not required,
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(2)::text  -- should NOT see result
    );


select clear_wal();
insert into public.notes(id, user_id) values (1, seed_uuid(1));

begin;
    select
        -- set an auth.uid() to seed_uuid(1)
        set_config(
            'request.jwt.claims',
            jsonb_build_object(
                'role', 'authenticated',
                'email', 'example@example.com',
                'sub', seed_uuid(1)::text
            )::text,
            true
        );

    select auth.uid();

    -- Expect 1 entry in the subscriber array matching ^
    select
        rec,
        is_rls_enabled,
        subscription_ids,
        errors
    from
       walrus;

end;

drop table public.notes;
select pg_drop_replication_slot('realtime');
truncate table realtime.subscription;
