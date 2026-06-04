-- Feature flags with environments, variants, JSONB targeting, overrides, and SQL evaluation.

create table if not exists public.feature_flag_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.feature_flag_environments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.feature_flag_projects(id) on delete cascade,
  key text not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, key)
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.feature_flag_projects(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  enabled boolean not null default false,
  default_value jsonb not null default 'true',
  rollout_percentage numeric not null default 100 check (
    rollout_percentage >= 0 and rollout_percentage <= 100
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, key)
);

create table if not exists public.feature_flag_variants (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  key text not null,
  value jsonb not null default 'true',
  weight int not null default 1 check (weight > 0),
  created_at timestamptz default now(),
  unique (flag_id, key)
);

create table if not exists public.feature_flag_rules (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  environment_id uuid references public.feature_flag_environments(id) on delete cascade,
  priority int not null default 100,
  name text,
  conditions jsonb not null default '{}',
  enabled boolean not null default true,
  variant_key text,
  value jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.feature_flag_overrides (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  environment_id uuid references public.feature_flag_environments(id) on delete cascade,
  subject_key text not null,
  enabled boolean not null default true,
  variant_key text,
  value jsonb,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (flag_id, environment_id, subject_key)
);

create table if not exists public.feature_flag_audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.feature_flag_projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null default auth.uid(),
  action text not null,
  target_type text not null,
  target_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists feature_flag_rules_lookup_idx
on public.feature_flag_rules (flag_id, environment_id, priority);

create index if not exists feature_flag_overrides_lookup_idx
on public.feature_flag_overrides (flag_id, environment_id, subject_key);

alter table public.feature_flag_projects enable row level security;
alter table public.feature_flag_environments enable row level security;
alter table public.feature_flags enable row level security;
alter table public.feature_flag_variants enable row level security;
alter table public.feature_flag_rules enable row level security;
alter table public.feature_flag_overrides enable row level security;
alter table public.feature_flag_audit_events enable row level security;

create policy "Authenticated users can read feature flag projects"
on public.feature_flag_projects for select
to authenticated
using (true);

create policy "Authenticated users can read feature flag environments"
on public.feature_flag_environments for select
to authenticated
using (true);

create policy "Authenticated users can read feature flags"
on public.feature_flags for select
to authenticated
using (true);

create policy "Authenticated users can read feature flag variants"
on public.feature_flag_variants for select
to authenticated
using (true);

create policy "Authenticated users can read feature flag rules"
on public.feature_flag_rules for select
to authenticated
using (true);

create policy "Authenticated users can read their feature flag overrides"
on public.feature_flag_overrides for select
to authenticated
using (subject_key = auth.uid()::text);

create or replace function public.pick_feature_flag_variant(
  flag_id uuid,
  subject_key text
)
returns table (
  variant_key text,
  value jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  total_weight int;
  bucket int;
  running_weight int := 0;
  variant record;
begin
  select coalesce(sum(weight), 0)
  into total_weight
  from public.feature_flag_variants
  where feature_flag_variants.flag_id = pick_feature_flag_variant.flag_id;

  if total_weight = 0 then
    return;
  end if;

  bucket := mod(
    abs(hashtext(pick_feature_flag_variant.flag_id::text || ':' || pick_feature_flag_variant.subject_key)),
    total_weight
  );

  for variant in
    select key, value, weight
    from public.feature_flag_variants
    where feature_flag_variants.flag_id = pick_feature_flag_variant.flag_id
    order by key
  loop
    running_weight := running_weight + variant.weight;
    if bucket < running_weight then
      variant_key := variant.key;
      value := variant.value;
      return next;
      return;
    end if;
  end loop;
end;
$$;

create or replace function public.evaluate_feature_flag(
  project_slug text,
  environment_key text,
  flag_key text,
  subject_key text default auth.uid()::text,
  attributes jsonb default '{}'
)
returns table (
  enabled boolean,
  variant_key text,
  value jsonb,
  reason text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project public.feature_flag_projects;
  target_environment public.feature_flag_environments;
  target_flag public.feature_flags;
  override_row public.feature_flag_overrides;
  rule_row public.feature_flag_rules;
  picked_variant record;
  rollout_bucket numeric;
begin
  select *
  into target_project
  from public.feature_flag_projects
  where slug = evaluate_feature_flag.project_slug;

  if not found then
    enabled := false;
    variant_key := null;
    value := 'false';
    reason := 'project_not_found';
    return next;
    return;
  end if;

  select *
  into target_environment
  from public.feature_flag_environments
  where project_id = target_project.id
    and key = evaluate_feature_flag.environment_key;

  if not found then
    enabled := false;
    variant_key := null;
    value := 'false';
    reason := 'environment_not_found';
    return next;
    return;
  end if;

  select *
  into target_flag
  from public.feature_flags
  where project_id = target_project.id
    and key = evaluate_feature_flag.flag_key;

  if not found then
    enabled := false;
    variant_key := null;
    value := 'false';
    reason := 'flag_not_found';
    return next;
    return;
  end if;

  select *
  into override_row
  from public.feature_flag_overrides
  where flag_id = target_flag.id
    and environment_id = target_environment.id
    and subject_key = evaluate_feature_flag.subject_key;

  if found then
    enabled := override_row.enabled;
    variant_key := override_row.variant_key;
    value := coalesce(override_row.value, target_flag.default_value);
    reason := 'override';
    return next;
    return;
  end if;

  if not target_flag.enabled then
    enabled := false;
    variant_key := null;
    value := target_flag.default_value;
    reason := 'flag_disabled';
    return next;
    return;
  end if;

  select *
  into rule_row
  from public.feature_flag_rules
  where flag_id = target_flag.id
    and enabled = true
    and (environment_id is null or environment_id = target_environment.id)
    and evaluate_feature_flag.attributes @> conditions
  order by priority asc, created_at asc
  limit 1;

  if found then
    enabled := true;
    variant_key := rule_row.variant_key;
    value := coalesce(rule_row.value, target_flag.default_value);
    reason := 'rule';
    return next;
    return;
  end if;

  rollout_bucket := mod(
    abs(hashtext(target_flag.id::text || ':' || evaluate_feature_flag.subject_key)),
    10000
  ) / 100.0;

  if rollout_bucket >= target_flag.rollout_percentage then
    enabled := false;
    variant_key := null;
    value := target_flag.default_value;
    reason := 'rollout';
    return next;
    return;
  end if;

  select *
  into picked_variant
  from public.pick_feature_flag_variant(target_flag.id, evaluate_feature_flag.subject_key)
  limit 1;

  enabled := true;
  variant_key := picked_variant.variant_key;
  value := coalesce(picked_variant.value, target_flag.default_value);
  reason := case when picked_variant.variant_key is null then 'default' else 'variant' end;
  return next;
end;
$$;

insert into public.feature_flag_projects (slug, name)
values ('app', 'Application')
on conflict (slug) do nothing;

insert into public.feature_flag_environments (project_id, key, name)
select id, 'production', 'Production'
from public.feature_flag_projects
where slug = 'app'
on conflict (project_id, key) do nothing;
