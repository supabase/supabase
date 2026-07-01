-- Community-docs: repo registry, snapshot history, human grades.
-- Internal ops data. Written by the sync script using the service role key.
-- No RLS: dashboards connect via direct Postgres, not PostgREST.

create table community_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  repos_seen int,
  repos_failed int,
  notes text
);

create table community_repos (
  owner text not null,
  name text not null,
  org text not null,
  html_url text not null,
  first_seen_at timestamptz not null default now(),
  last_synced_at timestamptz,
  is_archived boolean not null default false,
  is_template boolean not null default false,
  primary key (owner, name)
);

create table community_repo_snapshots (
  id bigserial primary key,
  owner text not null,
  name text not null,
  sync_run_id uuid not null references community_sync_runs(id),
  captured_at timestamptz not null default now(),
  stars int,
  forks int,
  watchers int,
  open_issues int,
  last_commit_at timestamptz,
  last_release_at timestamptz,
  default_branch text,
  license_spdx text,
  readme_length int,
  has_docs_folder boolean,
  has_examples boolean,
  has_ci boolean,
  has_code_of_conduct boolean,
  computed_quality_score int,
  foreign key (owner, name) references community_repos(owner, name)
);
create index community_repo_snapshots_by_repo_captured_at
  on community_repo_snapshots (owner, name, captured_at desc);
create index community_repo_snapshots_by_run
  on community_repo_snapshots (sync_run_id);

create table community_repo_grades (
  owner text not null,
  name text not null,
  tier text check (tier in ('A', 'B', 'C')),
  notes text,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (owner, name),
  foreign key (owner, name) references community_repos(owner, name)
);

create view latest_repo_metrics as
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

create view quality_deltas_by_week as
select
  owner,
  name,
  date_trunc('week', captured_at) as week,
  max(computed_quality_score) - min(computed_quality_score) as score_delta,
  max(computed_quality_score) as score_end
from community_repo_snapshots
group by 1, 2, 3;
