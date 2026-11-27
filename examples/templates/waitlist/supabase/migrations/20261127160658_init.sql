-- Waitlist: a launch page where people join with their email, get a referral
-- link, and move up the list for every friend who joins through it.
--
-- Access model: people can read and edit only their own entry. Everything
-- shared (the total, positions and the leaderboard) comes from functions that
-- return aggregates and initials, never emails or full names. A trigger
-- broadcasts the new total over Realtime whenever someone joins or leaves.

create schema if not exists private;

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  name text not null check (char_length(name) between 1 and 60),
  -- Short code for this person's referral link: `/?ref=<code>`.
  referral_code text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  -- Set from `referral_code_used` by a trigger, since people can't read other entries.
  referred_by uuid references public.waitlist_entries (id) on delete set null,
  referral_code_used text check (char_length(referral_code_used) <= 32),
  created_at timestamptz not null default now()
);

create unique index waitlist_entries_email_idx on public.waitlist_entries (lower(email));
create index waitlist_entries_referred_by_idx on public.waitlist_entries (referred_by);
create index waitlist_entries_created_at_idx on public.waitlist_entries (created_at);

alter table public.waitlist_entries enable row level security;

-- New tables aren't exposed to the Data API without explicit grants (the
-- default for new projects), so grant exactly what the policies below allow.
-- Column grants keep everything except the name fixed after joining
-- (referral fields, email, created_at), while the referred_by foreign key
-- can still clear itself when a referrer leaves.
-- Start from nothing, in case the project still grants new tables by default.
revoke all on public.waitlist_entries from anon, authenticated;
grant select (id, user_id, name, email, referral_code, created_at)
  on public.waitlist_entries to authenticated;
grant insert (name, email, referral_code_used) on public.waitlist_entries to authenticated;
grant update (name) on public.waitlist_entries to authenticated;
grant delete on public.waitlist_entries to authenticated;

create policy "People can view their entry"
on public.waitlist_entries for select
to authenticated
using (user_id = (select auth.uid()));

create policy "People can join once"
on public.waitlist_entries for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "People can update their name"
on public.waitlist_entries for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "People can leave the list"
on public.waitlist_entries for delete
to authenticated
using (user_id = (select auth.uid()));

-- Resolve a referral code to the referrer's entry, ignoring unknown codes and
-- self-referrals. Clients can't set referred_by themselves.
create function private.resolve_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.referred_by := null;
  if new.referral_code_used is not null then
    select id into new.referred_by
    from public.waitlist_entries
    where referral_code = lower(new.referral_code_used)
      and user_id <> new.user_id;
  end if;
  return new;
end;
$$;

revoke all on function private.resolve_referral() from public;

create trigger resolve_referral
before insert on public.waitlist_entries
for each row execute function private.resolve_referral();

-- Ranking: more referrals first, then earlier sign-ups.
create function private.ranked_entries()
returns table (id uuid, user_id uuid, name text, referrals bigint, place bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with counts as (
    select referred_by as id, count(*) as referrals
    from public.waitlist_entries
    where referred_by is not null
    group by referred_by
  )
  select
    entry.id,
    entry.user_id,
    entry.name,
    coalesce(counts.referrals, 0) as referrals,
    row_number() over (
      order by coalesce(counts.referrals, 0) desc, entry.created_at, entry.id
    ) as place
  from public.waitlist_entries as entry
  left join counts on counts.id = entry.id;
$$;

revoke all on function private.ranked_entries() from public;

-- "J. D." from "Jane Doe": enough for a leaderboard, without full names.
create function private.initials(full_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select string_agg(upper(left(part, 1)) || '.', ' ')
  from (
    select part
    from regexp_split_to_table(trim(full_name), '\s+') with ordinality as parts(part, n)
    where part <> ''
    order by n
    limit 2
  ) as first_two;
$$;

create function private.waitlist_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.waitlist_entries),
    'me', (
      select jsonb_build_object(
        'name', ranked.name,
        'referral_code', entry.referral_code,
        'referrals', ranked.referrals,
        'position', ranked.place
      )
      from private.ranked_entries() as ranked
      join public.waitlist_entries as entry on entry.id = ranked.id
      where ranked.user_id = (select auth.uid())
    ),
    'leaderboard', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'initials', private.initials(name),
          'referrals', referrals,
          'is_me', user_id = (select auth.uid())
        )
        order by place
      )
      from (
        select * from private.ranked_entries()
        where referrals > 0
        order by place
        limit 5
      ) as top
    ), '[]'::jsonb)
  );
$$;

revoke all on function private.waitlist_status() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.waitlist_status() to anon, authenticated;

-- Public entry point: the total, your own entry and position, and the top
-- referrers by initials.
create function public.waitlist_status()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.waitlist_status();
$$;

-- Tell everyone on the page that the list changed. Clients listen on the
-- public `waitlist` topic and refresh their status.
create function private.broadcast_waitlist_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('total', (select count(*) from public.waitlist_entries)),
    'changed',
    'waitlist',
    false
  );
  return null;
end;
$$;

revoke all on function private.broadcast_waitlist_total() from public;

create trigger broadcast_waitlist_total
after insert or delete on public.waitlist_entries
for each statement execute function private.broadcast_waitlist_total();
