-- Community-docs quality dashboard: allowlist + RLS for authenticated reads.
-- Sync script continues to write with the service role (bypasses RLS).

create table community_dashboard_allowlist (
  email text primary key,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now()
);

-- Seed allowlisted users in Studio or via SQL after apply, e.g.:
-- insert into community_dashboard_allowlist (email, role) values
--   ('you@supabase.com', 'editor'),
--   ('you@supabase.io', 'viewer');

create or replace function public.is_dashboard_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_dashboard_allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_dashboard_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_dashboard_allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role = 'editor'
  );
$$;

revoke all on function public.is_dashboard_user() from public;
revoke all on function public.is_dashboard_editor() from public;
grant execute on function public.is_dashboard_user() to authenticated;
grant execute on function public.is_dashboard_editor() to authenticated;

alter table community_sync_runs enable row level security;
alter table community_repos enable row level security;
alter table community_repo_snapshots enable row level security;
alter table community_repo_grades enable row level security;
alter table community_dashboard_allowlist enable row level security;

create policy "dashboard users can read sync runs"
  on community_sync_runs
  for select
  to authenticated
  using (public.is_dashboard_user());

create policy "dashboard users can read repos"
  on community_repos
  for select
  to authenticated
  using (public.is_dashboard_user());

create policy "dashboard users can read snapshots"
  on community_repo_snapshots
  for select
  to authenticated
  using (public.is_dashboard_user());

create policy "dashboard users can read grades"
  on community_repo_grades
  for select
  to authenticated
  using (public.is_dashboard_user());

create policy "dashboard editors can insert grades"
  on community_repo_grades
  for insert
  to authenticated
  with check (public.is_dashboard_editor());

create policy "dashboard editors can update grades"
  on community_repo_grades
  for update
  to authenticated
  using (public.is_dashboard_editor())
  with check (public.is_dashboard_editor());

create policy "users can read their allowlist row"
  on community_dashboard_allowlist
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

grant select on community_sync_runs to authenticated;
grant select on community_repos to authenticated;
grant select on community_repo_snapshots to authenticated;
grant select, insert, update on community_repo_grades to authenticated;
grant select on community_dashboard_allowlist to authenticated;

-- Recreate views as security invoker so they honor underlying RLS.
drop view if exists latest_repo_metrics;
drop view if exists quality_deltas_by_week;

create view latest_repo_metrics
with (security_invoker = true)
as
select distinct on (s.owner, s.name)
  s.owner,
  s.name,
  s.captured_at,
  s.stars,
  s.forks,
  s.watchers,
  s.open_issues,
  s.last_commit_at,
  s.last_release_at,
  s.default_branch,
  s.license_spdx,
  s.readme_length,
  s.has_docs_folder,
  s.has_examples,
  s.has_ci,
  s.has_code_of_conduct,
  s.computed_quality_score,
  r.html_url,
  r.is_archived,
  r.is_template,
  g.tier,
  g.notes as grade_notes
from community_repo_snapshots s
join community_repos r using (owner, name)
left join community_repo_grades g using (owner, name)
order by s.owner, s.name, s.captured_at desc;

create view quality_deltas_by_week
with (security_invoker = true)
as
select
  owner,
  name,
  date_trunc('week', captured_at) as week,
  max(computed_quality_score) - min(computed_quality_score) as score_delta,
  max(computed_quality_score) as score_end
from community_repo_snapshots
group by 1, 2, 3;

grant select on latest_repo_metrics to authenticated;
grant select on quality_deltas_by_week to authenticated;
