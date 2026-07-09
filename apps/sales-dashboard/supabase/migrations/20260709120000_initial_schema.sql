-- Sales Dashboard: Phase 1 schema (leads, quotes, activities)
-- Single-tenant per user: every row is owned by the authenticated user who created it.

create extension if not exists "pgcrypto" with schema extensions;

create type public.lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'unqualified',
  'converted'
);

create type public.quote_stage as enum (
  'draft',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired'
);

create type public.activity_type as enum (
  'call',
  'email',
  'meeting',
  'note',
  'follow_up'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Leads --------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  source text,
  status public.lead_status not null default 'new',
  estimated_value numeric(12, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index leads_owner_id_idx on public.leads (owner_id);
create index leads_status_idx on public.leads (status);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

create policy "Owners can manage their leads"
  on public.leads
  as permissive
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Quotes ---------------------------------------------------------------------

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  title text not null,
  amount numeric(12, 2) not null default 0,
  stage public.quote_stage not null default 'draft',
  sent_at timestamptz,
  decided_at timestamptz,
  valid_until date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index quotes_owner_id_idx on public.quotes (owner_id);
create index quotes_lead_id_idx on public.quotes (lead_id);
create index quotes_stage_idx on public.quotes (stage);

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

alter table public.quotes enable row level security;

create policy "Owners can manage their quotes"
  on public.quotes
  as permissive
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Activities -------------------------------------------------------------

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete cascade,
  type public.activity_type not null default 'note',
  subject text not null,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index activities_owner_id_idx on public.activities (owner_id);
create index activities_lead_id_idx on public.activities (lead_id);
create index activities_quote_id_idx on public.activities (quote_id);
create index activities_due_at_idx on public.activities (due_at);

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

alter table public.activities enable row level security;

create policy "Owners can manage their activities"
  on public.activities
  as permissive
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
