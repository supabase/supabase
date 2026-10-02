/*
Tests that subscribing with a nonexistent column in selected_columns raises an exception
*/

create table public.notes(
    id int primary key,
    body text
);

insert into realtime.subscription(subscription_id, entity, claims, selected_columns)
select
    seed_uuid(1),
    'public.notes',
    jsonb_build_object(
        'role', 'authenticated',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    ),
    array['nonexistent_column'];


drop table public.notes;
truncate table realtime.subscription;
