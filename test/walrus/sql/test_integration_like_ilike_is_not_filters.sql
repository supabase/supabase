create table public.notes(
    id int primary key,
    body text,
    nullable_body text
);

-- ── Subscription path ──

-- A plain equality filter still round-trips now that `negate` is part of
-- realtime.user_defined_filter.
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000001',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000001'),
    array[('id', 'eq', '6', false)]::realtime.user_defined_filter[]
);

-- The PostgREST-parity operators are accepted, negation included.
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000002',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000002'),
    array[
        ('body', 'ilike', '%world%', false),
        ('body', 'like',  '%x%',     true)
    ]::realtime.user_defined_filter[]
);

-- filters is normalized (sorted by column_name, op, value, negate).
select filters from realtime.subscription order by subscription_id;

-- `is` with an invalid keyword value is rejected at subscription time.
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000004',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000004'),
    array[('body', 'is', 'maybe', false)]::realtime.user_defined_filter[]
);

-- like/ilike on a non-text column is rejected at subscription time.
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000005',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000005'),
    array[('id', 'like', '%5%', false)]::realtime.user_defined_filter[]
);

-- An invalid regex is rejected at subscription time.
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000006',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000006'),
    array[('body', 'match', '(unclosed', false)]::realtime.user_defined_filter[]
);

-- match/imatch on a non-text column is rejected at subscription time (the regex
-- operator has no overload for the column type, which would abort apply_rls).
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000007',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000007'),
    array[('id', 'match', 'foo.*', false)]::realtime.user_defined_filter[]
);

-- `is true` on a non-boolean column is rejected at subscription time (only
-- `is null` is type-agnostic).
insert into realtime.subscription(subscription_id, entity, claims, filters)
values (
    '00000000-0000-0000-0000-000000000008',
    'public.notes',
    jsonb_build_object('role', 'authenticated', 'email', 'a@example.com', 'sub', '00000000-0000-0000-0000-000000000008'),
    array[('body', 'is', 'true', false)]::realtime.user_defined_filter[]
);

-- ── Evaluation path (realtime.is_visible_through_filters) ──
-- A row equivalent to public.notes(id=1, body='hello world', nullable_body=null).

-- like: matches                                       → visible (true)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    array[('body', 'like', '%world%', false)]::realtime.user_defined_filter[]
);

-- ilike: case-insensitive match                       → visible (true)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    array[('body', 'ilike', '%WORLD%', false)]::realtime.user_defined_filter[]
);

-- NOT LIKE: row matches pattern                        → not visible (false)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    array[('body', 'like', '%world%', true)]::realtime.user_defined_filter[]
);

-- NOT IN: value inside the list                        → not visible (false)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    array[('body', 'in', '{hello world,other}', true)]::realtime.user_defined_filter[]
);

-- is null on a null column                            → visible (true)
select realtime.is_visible_through_filters(
    array[('nullable_body', 'text', null, 'null'::jsonb, false, true)]::realtime.wal_column[],
    array[('nullable_body', 'is', 'null', false)]::realtime.user_defined_filter[]
);

-- is not null on a null column                        → not visible (false)
select realtime.is_visible_through_filters(
    array[('nullable_body', 'text', null, 'null'::jsonb, false, true)]::realtime.wal_column[],
    array[('nullable_body', 'is', 'null', true)]::realtime.user_defined_filter[]
);

-- isdistinct vs a different value                     → visible (true)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    array[('body', 'isdistinct', 'other', false)]::realtime.user_defined_filter[]
);

-- Fail closed: filter references a column absent from the WAL payload → not visible (false)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    array[('missing', 'eq', 'x', false)]::realtime.user_defined_filter[]
);

-- No filters                                           → visible (true)
select realtime.is_visible_through_filters(
    array[('body', 'text', null, '"hello world"'::jsonb, false, true)]::realtime.wal_column[],
    '{}'::realtime.user_defined_filter[]
);

truncate table realtime.subscription;
drop table public.notes;
