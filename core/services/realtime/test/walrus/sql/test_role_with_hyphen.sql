select 1 from pg_create_logical_replication_slot('realtime', 'wal2json', false);


create role "has-hyphen" nologin noinherit;

create schema private;

grant usage on schema private to "has-hyphen";
alter default privileges in schema private grant all on tables to "has-hyphen";
alter default privileges in schema private grant all on functions to "has-hyphen";
alter default privileges in schema private grant all on sequences to "has-hyphen";

create table private.notes(
    id int primary key
);

create policy rls_note_select
on private.notes
to "has-hyphen"
using (true);

alter table private.notes enable row level security;

insert into realtime.subscription(subscription_id, entity, claims)
select
    seed_uuid(1),
    'private.notes',
    jsonb_build_object(
        'role', 'has-hyphen',
        'email', 'example@example.com',
        'sub', seed_uuid(1)::text
    );

select clear_wal();
insert into private.notes(id) values (1);

select
    rec,
    is_rls_enabled,
    subscription_ids,
    errors
from
   walrus;


drop table private.notes;
drop schema private;
select pg_drop_replication_slot('realtime');
truncate table realtime.subscription;
