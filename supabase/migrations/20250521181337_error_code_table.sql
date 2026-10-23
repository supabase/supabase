create schema if not exists utils;

grant usage on schema utils to anon;
grant usage on schema utils to authenticated;

alter default privileges in schema utils
revoke execute on functions from anon;

alter default privileges in schema utils
revoke execute on functions from authenticated;

create or replace function utils.update_timestamp()
returns trigger
set search_path = ''
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

grant execute on function utils.update_timestamp() to anon;
grant execute on function utils.update_timestamp() to authenticated;

-- Create a new schema to keep things organized since we'll be adding a lot of
-- content tables
create schema if not exists content;

grant usage on schema content to anon;
grant usage on schema content to authenticated;

create table if not exists content.service (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz default null
);

create or replace trigger sync_updated_at_content_service
before update on content.service
for each row
execute function utils.update_timestamp();

create or replace rule soft_delete_content_service as
on delete to content.service
do instead (
    update content.service
    set deleted_at = now()
    where id = old.id
);

alter table content.service
enable row level security;

create index if not exists idx_content_service_id_nondeleted_only
on content.service (id)
where deleted_at is null;

create index if not exists idx_content_service_name_nondeleted_only
on content.service (name)
where deleted_at is null;

insert into content.service (name) values
    ('AUTH'),
    ('REALTIME'),
    ('STORAGE');

create table if not exists content.error (
    code text not null,
    service uuid not null references content.service (id) on delete restrict,
    http_status_code smallint,
    message text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz default null,
    primary key (service, code)
);

create or replace trigger sync_updated_at_content_error
before update on content.error
for each row
execute function utils.update_timestamp();

create or replace rule soft_delete_content_error as
on delete to content.error
do instead (
    update content.error
    set deleted_at = now()
    where code = old.code and service = old.service
);

alter table content.error
enable row level security;

create index if not exists idx_content_error_service_code_nondeleted_only
on content.error (service, code)
where deleted_at is null;

grant select (
    id,
    name,
    deleted_at
) on content.service to anon;

grant select (
    id,
    name,
    deleted_at
) on content.service to authenticated;

grant select (
    code,
    service,
    http_status_code,
    message,
    deleted_at
) on content.error to anon;

grant select (
    code,
    service,
    http_status_code,
    message,
    deleted_at
) on content.error to authenticated;

create policy content_service_anon_select_all
on content.service
for select
to anon
using (deleted_at is null);

create policy content_service_authenticated_select_all
on content.service
for select
to authenticated
using (deleted_at is null);

create policy content_error_anon_select_all
on content.error
for select
to anon
using (deleted_at is null);

create policy content_error_authenticated_select_all
on content.error
for select
to authenticated
using (deleted_at is null);
