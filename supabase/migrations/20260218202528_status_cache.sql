create table if not exists public.incident_status_cache (
	id bigint primary key generated always as identity,
	incident_id text unique not null,
	shortlink text unique not null,
	updated_at timestamptz not null default now(),
	affects_project_creation boolean not null default false,
	affected_regions text[]
);

alter table public.incident_status_cache
enable row level security;

revoke all on public.incident_status_cache from anon;
revoke all on public.incident_status_cache from authenticated;

create index if not exists idx_incident_status_cache_incident_id
on public.incident_status_cache (incident_id);

create index if not exists idx_incident_status_cache_shortlink
on public.incident_status_cache (shortlink);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger set_incident_status_cache_updated_at
before update on public.incident_status_cache
for each row
execute function public.set_updated_at();
