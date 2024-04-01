import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { lintKeys } from './keys'

export const LINT_SQL = `(
with foreign_keys as (
    select
        cl.relnamespace::regnamespace as schema_,
        cl.oid::regclass as table_,
        ct.conname as fkey_name,
        ct.conkey col_attnums
    from
        pg_constraint ct
        join pg_class cl -- fkey owning table
            on ct.conrelid = cl.oid
        left join pg_depend d
            on d.objid = cl.oid
            and d.deptype = 'e'
    where
        ct.contype = 'f' -- foreign key constraints
        and d.objid is null -- exclude tables that are dependencies of extensions
        and cl.relnamespace::regnamespace::text not in (
            'pg_catalog', 'information_schema', 'auth', 'storage', 'vault', 'extensions'
        )
),
index_ as (
    select
        indrelid::regclass as table_,
        indexrelid::regclass as index_,
        string_to_array(indkey::text, ' ')::smallint[] as col_attnums
    from
        pg_index
    where
        indisvalid
)
select
    'unindexed_foreign_keys' as name,
    'INFO' as level,
    'EXTERNAL' as facing,
    'Identifies foreign key constraints without a covering index, which can impact database performance.' as description,
    format(
        'Table \`%s.%s\` has a foreign key \`%s\` without a covering index. This can lead to suboptimal query performance.',
        fk.schema_,
        fk.table_,
        fk.table_,
        fk.fkey_name
    ) as detail,
    'https://supabase.github.io/splinter/0001_unindexed_foreign_keys' as remediation,
    jsonb_build_object(
        'schema', fk.schema_,
        'name', fk.table_,
        'type', 'table',
        'fkey_name', fk.fkey_name,
        'fkey_columns', fk.col_attnums
    ) as metadata,
    format('0001_unindexed_foreign_keys_%s_%s_%s', fk.schema_, fk.table_, fk.fkey_name) as cache_key
from
    foreign_keys fk
    left join index_ idx
        on fk.table_ = idx.table_
        and fk.col_attnums = idx.col_attnums
where
    idx.index_ is null
order by
    fk.table_,
    fk.fkey_name)
union all
(
select
    'auth_users_exposed' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    'Detects if auth.users is exposed to anon or authenticated roles via a view or materialized view in the public schema, potentially compromising user data security.' as description,
    format(
        'View/Materialized View "%s" in the public schema may expose \`auth.users\` data to anon or authenticated roles.',
        c.relname
    ) as detail,
    'https://supabase.github.io/splinter/0002_auth_users_exposed' as remediation,
    jsonb_build_object(
        'schema', 'public',
        'name', c.relname,
        'type', 'view',
        'exposed_to', array_remove(array_agg(DISTINCT case when pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') then 'anon' when pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT') then 'authenticated' end), null)
    ) as metadata,
    format('auth_users_exposed_%s_%s', 'public', c.relname) as cache_key
from
    pg_depend d
    join pg_rewrite r
        on r.oid = d.objid
    join pg_class c
        on c.oid = r.ev_class
    join pg_namespace n
        on n.oid = c.relnamespace
where
    d.refobjid = 'auth.users'::regclass
    and d.deptype = 'n'
    and c.relkind in ('v', 'm') -- v for view, m for materialized view
    and n.nspname = 'public'
    and (
      pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
      or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    -- Exclude self
    and c.relname <> '0002_auth_users_exposed'
group by
    c.relname, c.oid)
union all
(/*
Usage of auth.uid(), auth.role() ... are common in RLS policies.

A naive policy like

    create policy "rls_test_select" on test_table
    to authenticated
    using ( auth.uid() = user_id )

will re-evaluate the auth.uid() function for every row. That can result in 100s of times slower performance
https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

To resolve that issue, the function calls can be wrapped like "(select auth.uid())" which causes the value to
be executed exactly 1 time per query

For example:

    create policy "rls_test_select" on test_table
    to authenticated
    using ( (select auth.uid()) = user_id )

NOTE:
    This lint requires search_path = '' or 'auth' not in search_path
    because qual and with_check are dependent on search_path to determine if function calls include the "auth" schema
*/



with policies as (
    select
        nsp.nspname as schema_,
        polrelid::regclass table_,
        pc.relrowsecurity is_rls_active,
        polname as policy_name,
        polpermissive as is_permissive, -- if not, then restrictive
        (select array_agg(r::regrole) from unnest(polroles) as x(r)) as roles,
        case polcmd
            when 'r' then 'SELECT'
            when 'a' then 'INSERT'
            when 'w' then 'UPDATE'
            when 'd' then 'DELETE'
            when '*' then 'ALL'
        end as command,
        qual,
        with_check
    from
        pg_policy pa
        join pg_class pc
            on pa.polrelid = pc.oid
        join pg_namespace nsp
            on pc.relnamespace = nsp.oid
        join pg_policies pb
            on pc.relname = pb.tablename
            and nsp.nspname = pb.schemaname
            and pa.polname = pb.policyname
)
select
    'auth_rls_initplan' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    'Detects if calls to \`auth.<function>()\` in RLS policies are being unnecessarily re-evaluated for each row' as description,
    format(
        'Table \`%s\` has a row level security policy \`%s\` that re-evaluates an auth.<function>() for each row. This produces suboptimal query performance at scale. Resolve the issue by replacing \`auth.<function>()\` with \`(select auth.<function>())\`. See https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select for more.',
        table_,
        policy_name
    ) as detail,
    'https://supabase.github.io/splinter/0003_auth_rls_initplan' as remediation,
    jsonb_build_object(
        'schema', schema_,
        'name', table_,
        'type', 'table'
    ) as metadata,
    format('auth_rls_init_plan_%s_%s_%s', schema_, table_, policy_name) as cache_key
from
    policies
where
    is_rls_active
    and (
        (
            -- Example: auth.uid()
            qual  ~ '(auth)\.(uid|jwt|role|email)\(\)'
            -- Example: select auth.uid()
            and lower(qual) !~ 'select\s+(auth)\.(uid|jwt|role|email)\(\)'
        )
        or
        (
            -- Example: auth.uid()
            with_check  ~ '(auth)\.(uid|jwt|role|email)\(\)'
            -- Example: select auth.uid()
            and lower(with_check) !~ 'select\s+(auth)\.(uid|jwt|role|email)\(\)'
        )
    ))
union all
(
select
    'no_primary_key' as name,
    'INFO' as level,
    'EXTERNAL' as facing,
    'Detects if a table does not have a primary key. Tables without a primary key can be inefficient to interact with at scale.' as description,
    format(
        'Table \`%s.%s\` does not have a primary key',
        pgns.nspname,
        pgc.relname
    ) as detail,
    'https://supabase.github.io/splinter/0004_no_primary_key' as remediation,
     jsonb_build_object(
        'schema', pgns.nspname,
        'name', pgc.relname,
        'type', 'table'
    ) as metadata,
    format(
        'no_primary_key_%s_%s',
        pgns.nspname,
        pgc.relname
    ) as cache_key
from
    pg_class pgc
    join pg_namespace pgns
        on pgns.oid = pgc.relnamespace
    left join pg_index pgi
        on pgi.indrelid = pgc.oid
where
    pgc.relkind = 'r' -- regular tables
    and pgns.nspname not in (
        'pg_catalog', 'information_schema', 'auth', 'storage', 'vault', 'pgsodium'
    )
group by
    pgc.oid,
    pgns.nspname,
    pgc.relname
having
    max(coalesce(pgi.indisprimary, false)::int) = 0)
union all
(
select
    'unused_index' as name,
    'INFO' as level,
    'EXTERNAL' as facing,
    'Detects if an index has never been used and may be a candidate for removal.' as description,
    format(
        'Index \`%s\` on table \`%s.%s\` has not been used',
        psui.indexrelname,
        psui.schemaname,
        psui.relname
    ) as detail,
    'https://supabase.github.io/splinter/0005_unused_index' as remediation,
    jsonb_build_object(
        'schema', psui.schemaname,
        'name', psui.relname,
        'type', 'table'
    ) as metadata,
    format(
        'unused_index_%s_%s_%s',
        psui.schemaname,
        psui.relname,
        psui.indexrelname
    ) as cache_key

from
    pg_catalog.pg_stat_user_indexes psui
    join pg_catalog.pg_index pi
        on psui.indexrelid = pi.indexrelid
where
    psui.idx_scan = 0
    and not pi.indisunique
    and not pi.indisprimary
    and psui.schemaname not in (
        'pg_catalog', 'information_schema', 'auth', 'storage', 'vault', 'pgsodium'
    ))
union all
(
select
    'multiple_permissive_policies' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    'Detects if multiple permissive row level security policies are present on a table for the same \`role\` and \`action\` (e.g. insert). Multiple permissive policies are suboptimal for performance as each policy must be executed for every relevant query.' as description,
    format(
        'Table \`%s.%s\` has multiple permissive policies for role \`%s\` for action \`%s\`. Policies include \`%s\`',
        n.nspname,
        c.relname,
        r.rolname,
        act.cmd,
        array_agg(p.polname order by p.polname)
    ) as detail,
    'https://supabase.github.io/splinter/0006_multiple_permissive_policies' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'multiple_permissive_policies_%s_%s_%s_%s',
        n.nspname,
        c.relname,
        r.rolname,
        act.cmd
    ) as cache_key
from
    pg_catalog.pg_policy p
    join pg_catalog.pg_class c on p.polrelid = c.oid
    join pg_catalog.pg_namespace n on c.relnamespace = n.oid
    join pg_catalog.pg_roles r
        on p.polroles @> array[r.oid]
        or p.polroles = array[0::oid],
    lateral (
        select x.cmd
        from unnest((
            select
                case p.polcmd
                    when 'r' then array['SELECT']
                    when 'a' then array['INSERT']
                    when 'w' then array['UPDATE']
                    when 'd' then array['DELETE']
                    when '*' then array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
                    else array['ERROR']
                end as actions
        )) x(cmd)
    ) act(cmd)
where
    c.relkind = 'r' -- regular tables
    and n.nspname not in (
        'pg_catalog', 'information_schema', 'auth', 'storage', 'vault', 'pgsodium'
    )
    and r.rolname not like 'pg_%'
    and r.rolname not like 'supabase%admin'
    and not r.rolbypassrls
group by
    n.nspname,
    c.relname,
    r.rolname,
    act.cmd
having
    count(1) > 1)`.trim()

// Array of all lint rules we handle right now.
export const LINT_TYPES = [
  'unindexed_foreign_keys',
  'auth_users_exposed',
  'no_primary_key',
  'unused_index',
  'multiple_permissive_policies',
  'auth_rls_initplan',
] as const
export type LINT_TYPES = (typeof LINT_TYPES)[number]

export type Lint = {
  name: LINT_TYPES
  level: 'ERROR' | 'WARN' | 'INFO'
  facing: string
  description: string
  detail: string
  remediation: any
  metadata: {
    schema?: string
    name?: string
    type?: 'table' | 'view'
    fkey_name?: string
    fkey_columns?: number[]
  } | null
  cache_key: string
}

export type ProjectLintsVariables = {
  projectRef?: string
  connectionString?: string
}

const getProjectLints = async (
  { projectRef, connectionString }: ProjectLintsVariables,
  signal?: AbortSignal
) => {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: LINT_SQL,
      queryKey: lintKeys.lint(projectRef),
    },
    signal
  )
  return result
}

export type ProjectLintsData = Lint[]
export type ProjectLintsError = unknown

export const useProjectLintsQuery = <TData = ProjectLintsData>(
  { projectRef, connectionString }: ProjectLintsVariables,
  { enabled, ...options }: UseQueryOptions<ProjectLintsData, ProjectLintsError, TData> = {}
) =>
  useQuery<ProjectLintsData, ProjectLintsError, TData>(
    lintKeys.lint(projectRef),
    ({ signal }) => getProjectLints({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
