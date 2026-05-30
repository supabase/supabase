create table secured_table(
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default now(),
    organization_id text not null
);

alter table secured_table
enable row level security;

create policy "Only organization admins can insert in table"
on secured_table
for insert
to authenticated
with check (
  (((select auth.jwt()->>'org_role') = 'org:admin') or ((select auth.jwt()->'o'->>'rol') = 'admin'))
    and
  (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
);

create policy "Users can select from their own organization"
on secured_table
for select
to authenticated
using (
  (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
);

create policy "Only users that have passed second factor verification can read from table"
on secured_table
as restrictive
for select
to authenticated
using (
  ((select auth.jwt()->'fva'->>1) != '-1')
);
