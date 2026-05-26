-- Application-level rate limits and usage quotas.
-- These complement Supabase platform limits; they do not replace Auth/Realtime/Edge guardrails.

create table if not exists public.app_rate_limit_rules (
  key text primary key,
  algorithm text not null check (algorithm in ('fixed_window', 'token_bucket')),
  limit_count int not null check (limit_count > 0),
  window_seconds int not null default 60 check (window_seconds > 0),
  refill_rate_per_second numeric,
  burst_count int,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.app_rate_limit_counters (
  rule_key text not null references public.app_rate_limit_rules(key) on delete cascade,
  subject text not null,
  window_start timestamptz not null,
  count int not null default 0,
  updated_at timestamptz default now(),
  primary key (rule_key, subject, window_start)
);

create table if not exists public.app_rate_limit_buckets (
  rule_key text not null references public.app_rate_limit_rules(key) on delete cascade,
  subject text not null,
  tokens numeric not null,
  last_refill_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  primary key (rule_key, subject)
);

create index if not exists app_rate_limit_counters_subject_idx
on public.app_rate_limit_counters (subject, rule_key);

alter table public.app_rate_limit_rules enable row level security;
alter table public.app_rate_limit_counters enable row level security;
alter table public.app_rate_limit_buckets enable row level security;

create policy "Authenticated users can read app rate limit rules"
on public.app_rate_limit_rules for select
to authenticated
using (true);

create or replace function public.consume_app_rate_limit(
  rule_key text,
  subject text,
  cost int default 1
)
returns table (
  allowed boolean,
  remaining int,
  reset_at timestamptz,
  retry_after_seconds int
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule public.app_rate_limit_rules;
  now_at timestamptz := now();
  window_start_at timestamptz;
  current_count int;
  bucket public.app_rate_limit_buckets;
  refill_rate numeric;
  burst_limit int;
  refilled_tokens numeric;
begin
  if cost < 1 then
    raise exception 'cost must be at least 1';
  end if;

  select *
  into rule
  from public.app_rate_limit_rules
  where key = consume_app_rate_limit.rule_key;

  if not found then
    raise exception 'rate limit rule not found: %', rule_key;
  end if;

  if rule.algorithm = 'fixed_window' then
    window_start_at := to_timestamp(
      floor(extract(epoch from now_at) / rule.window_seconds) * rule.window_seconds
    );

    insert into public.app_rate_limit_counters as counters (
      rule_key,
      subject,
      window_start,
      count
    )
    values (
      consume_app_rate_limit.rule_key,
      consume_app_rate_limit.subject,
      window_start_at,
      cost
    )
    on conflict (rule_key, subject, window_start) do update
      set count = counters.count + cost,
          updated_at = now()
    returning count into current_count;

    allowed := current_count <= rule.limit_count;
    remaining := greatest(rule.limit_count - current_count, 0);
    reset_at := window_start_at + make_interval(secs => rule.window_seconds);
    retry_after_seconds := case
      when allowed then 0
      else greatest(ceil(extract(epoch from reset_at - now_at))::int, 1)
    end;

    return next;
    return;
  end if;

  refill_rate := coalesce(rule.refill_rate_per_second, rule.limit_count::numeric / rule.window_seconds);
  burst_limit := coalesce(rule.burst_count, rule.limit_count);

  insert into public.app_rate_limit_buckets as buckets (
    rule_key,
    subject,
    tokens,
    last_refill_at
  )
  values (
    consume_app_rate_limit.rule_key,
    consume_app_rate_limit.subject,
    burst_limit,
    now_at
  )
  on conflict (rule_key, subject) do nothing;

  select *
  into bucket
  from public.app_rate_limit_buckets
  where app_rate_limit_buckets.rule_key = consume_app_rate_limit.rule_key
    and app_rate_limit_buckets.subject = consume_app_rate_limit.subject
  for update;

  refilled_tokens := least(
    burst_limit,
    bucket.tokens + greatest(extract(epoch from now_at - bucket.last_refill_at), 0) * refill_rate
  );

  allowed := refilled_tokens >= cost;
  remaining := greatest(floor(refilled_tokens - case when allowed then cost else 0 end)::int, 0);
  reset_at := case
    when allowed then now_at
    else now_at + make_interval(secs => ceil((cost - refilled_tokens) / refill_rate)::int)
  end;
  retry_after_seconds := case
    when allowed then 0
    else greatest(ceil((cost - refilled_tokens) / refill_rate)::int, 1)
  end;

  update public.app_rate_limit_buckets
  set tokens = remaining,
      last_refill_at = now_at,
      updated_at = now_at
  where app_rate_limit_buckets.rule_key = consume_app_rate_limit.rule_key
    and app_rate_limit_buckets.subject = consume_app_rate_limit.subject;

  return next;
end;
$$;

create or replace function public.check_app_rate_limit(
  rule_key text,
  subject text,
  cost int default 1
)
returns table (
  allowed boolean,
  remaining int,
  reset_at timestamptz,
  retry_after_seconds int
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule public.app_rate_limit_rules;
  now_at timestamptz := now();
  window_start_at timestamptz;
  current_count int := 0;
  bucket public.app_rate_limit_buckets;
  refill_rate numeric;
  burst_limit int;
  refilled_tokens numeric;
begin
  select *
  into rule
  from public.app_rate_limit_rules
  where key = check_app_rate_limit.rule_key;

  if not found then
    raise exception 'rate limit rule not found: %', rule_key;
  end if;

  if rule.algorithm = 'fixed_window' then
    window_start_at := to_timestamp(
      floor(extract(epoch from now_at) / rule.window_seconds) * rule.window_seconds
    );

    select count
    into current_count
    from public.app_rate_limit_counters
    where app_rate_limit_counters.rule_key = check_app_rate_limit.rule_key
      and app_rate_limit_counters.subject = check_app_rate_limit.subject
      and window_start = window_start_at;

    current_count := coalesce(current_count, 0);
    allowed := current_count + cost <= rule.limit_count;
    remaining := greatest(rule.limit_count - current_count, 0);
    reset_at := window_start_at + make_interval(secs => rule.window_seconds);
    retry_after_seconds := case
      when allowed then 0
      else greatest(ceil(extract(epoch from reset_at - now_at))::int, 1)
    end;

    return next;
    return;
  end if;

  refill_rate := coalesce(rule.refill_rate_per_second, rule.limit_count::numeric / rule.window_seconds);
  burst_limit := coalesce(rule.burst_count, rule.limit_count);

  select *
  into bucket
  from public.app_rate_limit_buckets
  where app_rate_limit_buckets.rule_key = check_app_rate_limit.rule_key
    and app_rate_limit_buckets.subject = check_app_rate_limit.subject;

  if not found then
    refilled_tokens := burst_limit;
  else
    refilled_tokens := least(
      burst_limit,
      bucket.tokens + greatest(extract(epoch from now_at - bucket.last_refill_at), 0) * refill_rate
    );
  end if;

  allowed := refilled_tokens >= cost;
  remaining := floor(refilled_tokens)::int;
  reset_at := case
    when allowed then now_at
    else now_at + make_interval(secs => ceil((cost - refilled_tokens) / refill_rate)::int)
  end;
  retry_after_seconds := case
    when allowed then 0
    else greatest(ceil((cost - refilled_tokens) / refill_rate)::int, 1)
  end;

  return next;
end;
$$;

create or replace function public.reset_app_rate_limit(
  rule_key text,
  subject text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.app_rate_limit_counters
  where app_rate_limit_counters.rule_key = reset_app_rate_limit.rule_key
    and app_rate_limit_counters.subject = reset_app_rate_limit.subject;

  delete from public.app_rate_limit_buckets
  where app_rate_limit_buckets.rule_key = reset_app_rate_limit.rule_key
    and app_rate_limit_buckets.subject = reset_app_rate_limit.subject;
end;
$$;

insert into public.app_rate_limit_rules (
  key,
  algorithm,
  limit_count,
  window_seconds,
  metadata
)
values (
  'ai.generations.daily',
  'fixed_window',
  10,
  86400,
  '{"description": "Example daily AI generation quota per user or organization"}'
)
on conflict (key) do nothing;
