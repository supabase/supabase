import { createMarkdownCellSkeleton, createQueryCellSkeleton } from './utils'
import type { Notebooks } from '@/types'

// Shared by every check: the API roles, and the schemas the Data API serves. When
// `pgrst.db_schemas` is unreadable, fall back to the non-internal schemas the API roles
// can use, which is what a request could reach.
const EXPOSED_SCHEMAS = `with api_roles as (
  select oid, rolname from pg_roles where rolname in ('anon', 'authenticated')
),
exposed as (
  select n.oid, n.nspname
  from pg_namespace n
  where case
    when coalesce(current_setting('pgrst.db_schemas', true), '') <> ''
      then n.nspname = any (string_to_array(replace(current_setting('pgrst.db_schemas', true), ' ', ''), ','))
    else n.nspname not in ('auth', 'storage', 'realtime', '_realtime', 'extensions', 'graphql', 'graphql_public',
        'vault', 'pgsodium', 'pgsodium_masks', 'net', 'supabase_functions', 'supabase_migrations', 'cron',
        'pgbouncer', 'pgmq', 'information_schema', 'pg_catalog', 'pg_toast')
      and n.nspname not like 'pg_temp%' and n.nspname not like 'pg_toast_temp%'
      and exists (select 1 from api_roles r where has_schema_privilege(r.oid, n.oid, 'USAGE'))
  end
)`

const INTERNAL_SCHEMAS = `('auth', 'storage', 'realtime', 'extensions', 'vault', 'pgsodium', 'net', 'cron', 'supabase_functions')`

const section = (heading: string, body: string) =>
  createMarkdownCellSkeleton({ content: `### ${heading}\n\n${body.trim()}` })

const query = (title: string, sql: string) => createQueryCellSkeleton({ title, sql: sql.trim() })

const INSTRUCTIONS = `
# Security audit

This notebook is written for an AI agent. It finds what a Supabase project exposes to the public API key (\`anon\`) and to any signed-in user (\`authenticated\`) through the Data API, RPC functions, Storage and Auth hooks. A person can run it too: every query is read-only.

## Instructions for the agent

RLS is one layer of several. Table and column grants, function grants, default privileges, storage policies, auth settings and Edge Function code each open their own path. Check every layer, not only whether RLS is on.

For every object, ask what each identity can list, read, write and call:
- \`anon\`: anyone holding the publishable or anon key, which ships in client code.
- \`authenticated\`: any signed-in user. If sign-ups are open, anyone can become one, so a policy \`to authenticated\` that does not name the caller is a public policy.
- User B: a signed-in user reaching user A's rows, files or functions.

Rules:
- The audit is read-only. Never change grants, policies, functions or settings. Write each fix as SQL for the user to review and run.
- Never call the project's functions to test them, since they can have side effects.
- Never return row contents from user tables. To confirm reach, count rows inside a transaction as the API role, and stop at the proof:

\`\`\`sql
begin;
set local role anon;
select count(*) as reachable_rows from (select 1 from public.some_table limit 1000) t;
rollback;
\`\`\`

Steps:
1. If you can call the Supabase security advisors (\`get_advisors\` with \`type: "security"\`), do that first. They cover RLS disabled in \`public\`, policies that are always true, RLS that references user metadata, exposed \`auth.users\`, security definer views, mutable function \`search_path\`, \`SECURITY DEFINER\` functions executable by API roles, extensions in \`public\`, public buckets that allow listing, sensitive columns, GraphQL exposure, leaked service keys and Auth settings. Report advisor results by lint name and do not repeat them from this notebook.
2. Run every query cell in this notebook. Each section below says what its rows mean and when a row is not a finding.
3. Check each candidate against the definitions in the last query before reporting it. A helper that checks the caller, such as \`is_admin()\`, makes a policy or function fine.
4. Report, using the format at the end of this notebook.

If the query results are not shared with you, say so and ask the user to read them, or to share results with you. Mark the checks you could not read as unable to assess.
`

const NOT_COVERED = `
## What this notebook cannot see

Report these as unable to assess, and tell the user where to check:
- **Sign-ups and email confirmation** (Authentication > Sign In / Providers). With sign-ups open and confirmation off, anyone can register any address, including an employee's.
- **Edge Function code.** \`verify_jwt\` only proves that a valid JWT exists, and with legacy keys the anon key is a valid JWT. A function must take the caller's identity from the verified token, not from a \`user_id\` in the request body, and use a service-key client only after an explicit authorization check. If you can list Edge Functions, name the ones with \`verify_jwt\` off. That is fine for a webhook that verifies a provider signature over the raw body.
- **Service or secret keys** in client bundles, source maps or public assets.

## Not a finding

- The anon or publishable key in client code. It is public by design.
- \`using (true)\` on a lookup table that is meant to be public (regions, plans, feature names). Check the columns.
- A public bucket with read-only access that serves public assets.
- A \`SECURITY DEFINER\` function that pins \`search_path\`, checks the caller in its body and is not executable by \`anon\`.
- Default privileges in \`public\` on their own. They are the Supabase default.
`

const REPORT = `
## Report

Lead with the most severe findings, grouped by severity:
- **Critical**: \`anon\` reads private data, writes anything or calls an admin function.
- **High**: any signed-in user reaches another user's data.
- **Medium**: exposure that depends on another gap, or a missing scope not yet exploited.
- **Low**: hardening.

For each finding, give:
- **Object**: the table, column, function, bucket, policy or setting
- **Who reaches it**: \`anon\` or any signed-in user, and what they can read, write or call
- **Evidence**: the row from this notebook, the advisor lint or the definition line
- **Fix**: SQL for the user to review, based on the patterns below

Then list, one short line each, what was checked and is clear, and what could not be assessed and why. A clean result does not prove the project is secure.

## Fix patterns

\`\`\`sql
-- tables: RLS on, minimal grants, one policy per operation that names the caller
alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select, insert on public.messages to authenticated;
create policy "Read own messages" on public.messages for select to authenticated using ((select auth.uid()) = receiver_id);
create policy "Send as self" on public.messages for insert to authenticated with check ((select auth.uid()) = sender_id);

-- column grants: revoke each one; a table-level revoke leaves them in place
revoke select (body, phone) on public.message_log from anon;

-- functions: closed by default, opened one at a time
alter default privileges in schema public revoke execute on functions from anon, authenticated;
revoke execute on function public.admin_list_users() from public, anon, authenticated;

-- share links: check the token in a function, not with a table grant
create function public.get_shared_document(token text) returns setof public.documents
language sql security definer set search_path = '' stable as $$
  select * from public.documents where share_token = token
$$;
revoke select on public.documents from anon;

-- extensions: install outside exposed schemas
create extension http with schema extensions;

-- storage: bucket, owner folder and operation in every policy
create policy "Read own files" on storage.objects for select to authenticated using (
  bucket_id = 'docs' and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.allow_only_operation('object.get'));
update storage.buckets set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'] where id = 'avatars';

-- auth hooks: callable only by the Auth server, tables writable only by admins
revoke execute on function public.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.before_user_created(jsonb) to supabase_auth_admin;
revoke all on public.signup_email_domains from anon, authenticated;
grant select on public.signup_email_domains to supabase_auth_admin;
\`\`\`
`

type SecurityAuditCheck = {
  title: string
  /** What a row means, and when it isn't a finding. */
  note: string
  sql: string
}

const CHECKS: SecurityAuditCheck[] = [
  {
    title: 'Exposed schemas',
    note: `The schemas the Data API serves. Every check below reads from this list. \`source\` says how it was found: from \`pgrst.db_schemas\`, or, when that setting is unreadable, from the schemas \`anon\` or \`authenticated\` can use. Say which in the report, and point to the project's Data API settings when it is the fallback. An internal schema in the list is critical: \`storage\` lists every object in every bucket, and \`auth\` or \`vault\` expose credentials.`,
    sql: `
${EXPOSED_SCHEMAS}
select
  nspname as schema,
  case when coalesce(current_setting('pgrst.db_schemas', true), '') <> ''
    then 'pgrst.db_schemas' else 'used by API roles' end as source,
  nspname in ${INTERNAL_SCHEMAS} as is_internal
from exposed
order by nspname;
`,
  },

  {
    title: 'Tables and views without RLS',
    note: `Tables with RLS off, materialized views, foreign tables, and views that run as their owner, which an API role can read or write. Every privilege listed is open to every caller, because nothing filters the rows. The advisors only cover \`public\`, so rows in other schemas are new.`,
    sql: `
${EXPOSED_SCHEMAS}
select
  format('%I.%I', n.nspname, c.relname) as object,
  case c.relkind when 'v' then 'view' when 'm' then 'materialized view'
    when 'f' then 'foreign table' else 'table' end as kind,
  (select string_agg(r.rolname || ':' || p.priv, ', ' order by r.rolname, p.priv)
     from api_roles r, unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p(priv)
    where has_table_privilege(r.oid, c.oid, p.priv)) as api_privileges
from pg_class c
join exposed n on n.oid = c.relnamespace
where c.relkind in ('r', 'p', 'v', 'm', 'f')
  and not c.relrowsecurity
  and not (c.relkind = 'v' and coalesce('security_invoker=true' = any (c.reloptions), false))
  and c.oid not in (select objid from pg_depend where deptype = 'e')
  and exists (select 1 from api_roles r, unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p(priv)
              where has_table_privilege(r.oid, c.oid, p.priv))
order by 1;
`,
  },

  {
    title: 'Column grants',
    note: `Column grants without the matching table grant. \`select *\` fails, but naming the columns works, and a table-level revoke does not remove them, so teams think the table is closed. A finding unless the columns are public on purpose, such as a display name.`,
    sql: `
${EXPOSED_SCHEMAS}
select
  format('%I.%I', n.nspname, c.relname) as table_name,
  a.attname as column_name,
  r.rolname as role,
  x.privilege_type as privilege
from pg_attribute a
join pg_class c on c.oid = a.attrelid
join exposed n on n.oid = c.relnamespace
cross join lateral aclexplode(a.attacl) x
join api_roles r on r.oid = x.grantee
where a.attacl is not null
  and not a.attisdropped
  and not has_table_privilege(r.oid, c.oid, x.privilege_type)
order by 1, 2, 3;
`,
  },

  {
    title: 'Policies that never name the caller',
    note: `Permissive policies for \`public\`, \`anon\` or \`authenticated\` that never reference \`auth.uid()\`, \`auth.jwt()\` or the current role. Before reporting one, read any helper function it calls in the definitions below. Share-by-link predicates such as \`share_token is not null\` are findings: any caller can drop the client's filter and page through every shared row. The fix is to check the token in a function.`,
    sql: `
${EXPOSED_SCHEMAS}
select
  format('%I.%I', p.schemaname, p.tablename) as table_name,
  p.policyname as policy,
  p.cmd as command,
  array_to_string(p.roles, ', ') as roles,
  p.qual as using_expression,
  p.with_check as check_expression
from pg_policies p
where p.schemaname in (select nspname from exposed)
  and p.permissive = 'PERMISSIVE'
  and p.roles && array['public', 'anon', 'authenticated']::name[]
  and coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')
    !~* '(auth[.](uid|jwt)[(]|request[.]jwt|current_user|session_user)'
order by 1, 2;
`,
  },

  {
    title: 'Functions callable over RPC',
    note: `Functions \`anon\` can call, and \`SECURITY DEFINER\` functions signed-in users can call, at \`/rest/v1/rpc/<name>\`. New functions get \`EXECUTE\` for \`PUBLIC\` by default, so every function in an exposed schema is an endpoint until revoked. Severity depends on the body, in the definitions below. A definer function that returns or changes data without checking the caller bypasses RLS: critical for \`anon\`, high for signed-in users. An invoker function still runs its side effects, such as outbound requests, emails or writes to tables without RLS.`,
    sql: `
${EXPOSED_SCHEMAS}
select
  p.oid::regprocedure::text as function,
  case when p.prosecdef then 'definer' else 'invoker' end as security,
  (select string_agg(r.rolname, ', ' order by r.rolname) from api_roles r
    where has_function_privilege(r.oid, p.oid, 'EXECUTE')) as callable_by,
  exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')
    as search_path_pinned,
  pg_get_function_result(p.oid) as returns,
  p.provolatile = 'v' as is_volatile
from pg_proc p
join exposed n on n.oid = p.pronamespace
where p.prokind in ('f', 'p')
  and p.oid not in (select objid from pg_depend where deptype = 'e')
  and p.prorettype not in ('trigger'::regtype, 'event_trigger'::regtype)
  and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or (p.prosecdef and has_function_privilege('authenticated', p.oid, 'EXECUTE')))
order by p.prosecdef desc, 1;
`,
  },

  {
    title: 'Default privileges',
    note: `Grants that future objects inherit. Grants in \`public\` are the Supabase default and are context, not a finding: they mean every new function is callable by \`anon\` until revoked. The same grants in any other exposed schema are a finding, because every future table there is reachable from its first migration.`,
    sql: `
${EXPOSED_SCHEMAS}
select
  coalesce(n.nspname, 'all schemas') as schema,
  case d.defaclobjtype when 'r' then 'tables' when 'f' then 'functions' when 'S' then 'sequences'
    when 'T' then 'types' when 'n' then 'schemas' end as object_type,
  pg_get_userbyid(d.defaclrole) as for_objects_created_by,
  string_agg(distinct r.rolname || ':' || x.privilege_type, ', ') as grants
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
cross join lateral aclexplode(d.defaclacl) x
join api_roles r on r.oid = x.grantee
where (d.defaclnamespace = 0 or d.defaclnamespace in (select oid from exposed))
  and x.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXECUTE', 'USAGE')
group by n.nspname, d.defaclobjtype, d.defaclrole
order by 1, 2;
`,
  },

  {
    title: 'Extensions in exposed schemas',
    note: `Extension functions in an exposed schema are RPC endpoints. \`http\`, \`pg_net\` and \`dblink\` give any caller an outbound request primitive from the database, which is critical. Others are low unless they expose data. The advisors cover \`public\` only.`,
    sql: `
${EXPOSED_SCHEMAS}
select e.extname as extension, n.nspname as schema, e.extversion as version
from pg_extension e
join exposed n on n.oid = e.extnamespace
order by 1;
`,
  },

  {
    title: 'Storage buckets',
    note: `A public bucket skips policies for reads, so it must hold only public data. A public bucket with no MIME type limit accepts \`image/svg+xml\` and \`text/html\`, which run script when served from a trusted or custom domain.`,
    sql: `
select
  id as bucket,
  public as is_public,
  file_size_limit,
  coalesce(array_to_string(allowed_mime_types, ', '), 'any') as allowed_mime_types
from storage.buckets
order by public desc, id;
`,
  },

  {
    title: 'Storage policies',
    note: `Every policy on \`storage.objects\` and \`storage.buckets\`, with the scope each one sets. A policy without a bucket scope applies to every bucket, including ones created later. An \`INSERT\` or \`UPDATE\` without a caller scope lets one user write into another user's folder. A \`SELECT\` policy without an operation scope allows listing, which on a private bucket exposes every path it matches. Any \`SELECT\` policy on \`storage.buckets\` for \`anon\` maps the project.`,
    sql: `
select
  p.tablename as table_name,
  p.policyname as policy,
  p.cmd as command,
  array_to_string(p.roles, ', ') as roles,
  coalesce(p.qual, '') || coalesce(p.with_check, '') ~ 'bucket_id' as has_bucket_scope,
  coalesce(p.qual, '') || coalesce(p.with_check, '') ~* '(auth[.](uid|jwt)[(]|owner)' as has_caller_scope,
  coalesce(p.qual, '') ~ 'allow_(only|any)_operation' as has_operation_scope,
  p.qual as using_expression,
  p.with_check as check_expression
from pg_policies p
where p.schemaname = 'storage' and p.tablename in ('objects', 'buckets')
order by 1, 2;
`,
  },

  {
    title: 'Auth hooks',
    note: `Functions and tables granted to \`supabase_auth_admin\`, which are most likely Auth hooks and the tables they read. A hook function must not be callable by \`anon\` or \`authenticated\`. Read the body of a Before User Created hook in the definitions below: an allow-unless-blocked rule, which returns \`{}\` for unknown domains, fails open, and a hook should deny by default. A hook table that an API role can write, such as an allowed-domain list, lets anyone add their own domain.`,
    sql: `
with api_roles as (
  select oid, rolname from pg_roles where rolname in ('anon', 'authenticated')
),
auth_admin as (
  select oid from pg_roles where rolname = 'supabase_auth_admin'
)
select
  'function' as kind,
  p.oid::regprocedure::text as object,
  (select string_agg(r.rolname, ', ' order by r.rolname) from api_roles r
    where has_function_privilege(r.oid, p.oid, 'EXECUTE')) as api_access
from pg_proc p
where exists (select 1 from aclexplode(p.proacl) x where x.grantee in (select oid from auth_admin))
  and p.pronamespace not in (select oid from pg_namespace where nspname in ('auth', 'pg_catalog', 'information_schema'))
union all
select
  'table',
  format('%I.%I', n.nspname, c.relname),
  (select string_agg(r.rolname || ':' || p.priv, ', ' order by r.rolname, p.priv)
     from api_roles r, unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p(priv)
    where has_table_privilege(r.oid, c.oid, p.priv))
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p')
  and n.nspname not in ('auth', 'storage', 'realtime')
  and exists (select 1 from aclexplode(c.relacl) x where x.grantee in (select oid from auth_admin))
order by 1, 2;
`,
  },

  {
    title: 'Definitions to check',
    note: `The bodies of the functions the checks above depend on: definer functions an API role can call, Auth hook functions, and helper functions that policies call. Use these to decide whether a candidate is a finding, rather than calling the function.`,
    sql: `
${EXPOSED_SCHEMAS},
candidates as (
  select p.oid, 'definer function callable by an API role' as reason
  from pg_proc p join exposed n on n.oid = p.pronamespace
  where p.prosecdef and p.prokind = 'f'
    and exists (select 1 from api_roles r where has_function_privilege(r.oid, p.oid, 'EXECUTE'))
  union
  select p.oid, 'auth hook'
  from pg_proc p
  where exists (select 1 from aclexplode(p.proacl) x
                where x.grantee = (select oid from pg_roles where rolname = 'supabase_auth_admin'))
    and p.pronamespace not in (select oid from pg_namespace where nspname in ('auth', 'pg_catalog'))
  union
  select p.oid, 'called by a policy'
  from pg_proc p join exposed n on n.oid = p.pronamespace
  where p.prokind = 'f'
    and exists (select 1 from pg_policies pol
                where (pol.schemaname in (select nspname from exposed) or pol.schemaname = 'storage')
                  and position(p.proname || '(' in coalesce(pol.qual, '') || coalesce(pol.with_check, '')) > 0)
)
select
  c.oid::regprocedure::text as function,
  string_agg(distinct c.reason, ', ') as reason,
  left(pg_get_functiondef(c.oid), 4000) as definition
from candidates c
where c.oid not in (select objid from pg_depend where deptype = 'e')
group by c.oid
order by 1;
`,
  },
]

export const buildSecurityAuditCells = (): Notebooks.Content['cells'] => [
  createMarkdownCellSkeleton({ content: INSTRUCTIONS.trim() }),
  ...CHECKS.flatMap((check) => [section(check.title, check.note), query(check.title, check.sql)]),
  createMarkdownCellSkeleton({ content: NOT_COVERED.trim() }),
  createMarkdownCellSkeleton({ content: REPORT.trim() }),
]

/**
 * The notebook's text without its queries, for an agent running the audit without the
 * notebook. Check headings match the `check_name` values from `buildSecurityAuditQuery`.
 * Headings start at level 3 so the guide nests under a level 2 section of a prompt.
 */
export const buildSecurityAuditGuide = (): string =>
  [
    INSTRUCTIONS.trim(),
    ...CHECKS.map((check) => `### ${check.title}\n\n${check.note.trim()}`),
    NOT_COVERED.trim(),
    REPORT.trim(),
  ]
    .join('\n\n')
    .replace(/^(#+) /gm, '##$1 ')

/**
 * Every check as one read-only query, for an agent running the audit without the notebook:
 * one row per check, holding that check's rows as JSON, so it fits in a single approval and
 * under the Assistant's row cap.
 */
export const buildSecurityAuditQuery = (): string =>
  CHECKS.map(
    (check, index) =>
      `select ${index + 1} as step, '${check.title.replaceAll("'", "''")}' as check_name,\n` +
      `  coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) as results\n` +
      `from (\n${check.sql.trim().replace(/;$/, '')}\n) t`
  ).join('\nunion all\n') + '\norder by step;'
