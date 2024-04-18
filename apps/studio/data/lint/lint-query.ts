import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { lintKeys } from './keys'

export const LINT_SQL = `set local search_path = '';

(
with foreign_keys as (
    select
        cl.relnamespace::regnamespace as schema_,
        cl.oid::regclass as table_,
        ct.conname as fkey_name,
        ct.conkey col_attnums
    from
        pg_catalog.pg_constraint ct
        join pg_catalog.pg_class cl -- fkey owning table
            on ct.conrelid = cl.oid
        left join pg_catalog.pg_depend d
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
        indrelid as table_oid,
        indexrelid::regclass as index_,
        string_to_array(indkey::text, ' ')::smallint[] as col_attnums
    from
        pg_catalog.pg_index
    where
        indisvalid
)
select
    'unindexed_foreign_keys' as name,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    'Identifies foreign key constraints without a covering index, which can impact database performance.' as description,
    format(
        'Table \`%s.%s\` has a foreign key \`%s\` without a covering index. This can lead to suboptimal query performance.',
        fk.schema_,
        fk.table_,
        fk.fkey_name
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys' as remediation,
    jsonb_build_object(
        'schema', fk.schema_,
        'name', fk.table_,
        'type', 'table',
        'fkey_name', fk.fkey_name,
        'fkey_columns', fk.col_attnums
    ) as metadata,
    format('unindexed_foreign_keys_%s_%s_%s', fk.schema_, fk.table_, fk.fkey_name) as cache_key
from
    foreign_keys fk
    left join index_ idx
        on fk.table_ = idx.table_
        and fk.col_attnums = idx.col_attnums
    left join pg_catalog.pg_depend dep
        on idx.table_oid = dep.objid
        and dep.deptype = 'e'
where
    idx.index_ is null
    and fk.schema_::text not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude tables owned by extensions
order by
    fk.table_,
    fk.fkey_name)
union all
(
select
    'auth_users_exposed' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects if auth.users is exposed to anon or authenticated roles via a view or materialized view in the public schema, potentially compromising user data security.' as description,
    format(
        'View/Materialized View "%s" in the public schema may expose \`auth.users\` data to anon or authenticated roles.',
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed' as remediation,
    jsonb_build_object(
        'schema', 'public',
        'name', c.relname,
        'type', 'view',
        'exposed_to', array_remove(array_agg(DISTINCT case when pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') then 'anon' when pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT') then 'authenticated' end), null)
    ) as metadata,
    format('auth_users_exposed_%s_%s', 'public', c.relname) as cache_key
from
    -- Identify the oid for auth.users
	pg_catalog.pg_class auth_users_pg_class
    join pg_catalog.pg_namespace auth_users_pg_namespace
		on auth_users_pg_class.relnamespace = auth_users_pg_namespace.oid
		and auth_users_pg_class.relname = 'users'
		and auth_users_pg_namespace.nspname = 'auth'
	-- Depends on auth.users
    join pg_catalog.pg_depend d
    	on d.refobjid = auth_users_pg_class.oid
    join pg_catalog.pg_rewrite r
        on r.oid = d.objid
    join pg_catalog.pg_class c
        on c.oid = r.ev_class
    join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
    join pg_catalog.pg_class pg_class_auth_users
        on d.refobjid = pg_class_auth_users.oid
where
    d.deptype = 'n'
    and n.nspname = 'public'
    and (
      pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
      or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    -- Exclude self
    and c.relname <> '0002_auth_users_exposed'
    -- There are 3 insecure configurations
    and
    (
        -- Materialized views don't support RLS so this is insecure by default
        (c.relkind in ('m')) -- m for materialized view
        or
        -- Standard View, accessible to anon or authenticated that is security_definer
        (
            c.relkind = 'v' -- v for view
            -- Exclude security invoker views
            and not (
                lower(coalesce(c.reloptions::text,'{}'))::text[]
                && array[
                    'security_invoker=1',
                    'security_invoker=true',
                    'security_invoker=yes',
                    'security_invoker=on'
                ]
            )
        )
        or
        -- Standard View, security invoker, but no RLS enabled on auth.users
        (
            c.relkind in ('v') -- v for view
            -- is security invoker
            and (
                lower(coalesce(c.reloptions::text,'{}'))::text[]
                && array[
                    'security_invoker=1',
                    'security_invoker=true',
                    'security_invoker=yes',
                    'security_invoker=on'
                ]
            )
            and not pg_class_auth_users.relrowsecurity
        )
    )
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
        pg_catalog.pg_policy pa
        join pg_catalog.pg_class pc
            on pa.polrelid = pc.oid
        join pg_catalog.pg_namespace nsp
            on pc.relnamespace = nsp.oid
        join pg_catalog.pg_policies pb
            on pc.relname = pb.tablename
            and nsp.nspname = pb.schemaname
            and pa.polname = pb.policyname
)
select
    'auth_rls_initplan' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    'Detects if calls to \`auth.<function>()\` in RLS policies are being unnecessarily re-evaluated for each row' as description,
    format(
        'Table \`%s\` has a row level security policy \`%s\` that re-evaluates an auth.<function>() for each row. This produces suboptimal query performance at scale. Resolve the issue by replacing \`auth.<function>()\` with \`(select auth.<function>())\`. See [docs](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select) for more info.',
        table_,
        policy_name
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan' as remediation,
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
    and schema_::text not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
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
    array['PERFORMANCE'] as categories,
    'Detects if a table does not have a primary key. Tables without a primary key can be inefficient to interact with at scale.' as description,
    format(
        'Table \`%s.%s\` does not have a primary key',
        pgns.nspname,
        pgc.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0004_no_primary_key' as remediation,
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
    pg_catalog.pg_class pgc
    join pg_catalog.pg_namespace pgns
        on pgns.oid = pgc.relnamespace
    left join pg_catalog.pg_index pgi
        on pgi.indrelid = pgc.oid
    left join pg_catalog.pg_depend dep
        on pgc.oid = dep.objid
        and dep.deptype = 'e'
where
    pgc.relkind = 'r' -- regular tables
    and pgns.nspname not in (
        'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgsodium', 'pgsodium_masks', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'storage', 'supabase_functions', 'supabase_migrations', 'vault'
    )
    and dep.objid is null -- exclude tables owned by extensions
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
    array['PERFORMANCE'] as categories,
    'Detects if an index has never been used and may be a candidate for removal.' as description,
    format(
        'Index \`%s\` on table \`%s.%s\` has not been used',
        psui.indexrelname,
        psui.schemaname,
        psui.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index' as remediation,
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
    left join pg_catalog.pg_depend dep
        on psui.relid = dep.objid
        and dep.deptype = 'e'
where
    psui.idx_scan = 0
    and not pi.indisunique
    and not pi.indisprimary
    and dep.objid is null -- exclude tables owned by extensions
    and psui.schemaname not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    ))
union all
(
select
    'multiple_permissive_policies' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    'Detects if multiple permissive row level security policies are present on a table for the same \`role\` and \`action\` (e.g. insert). Multiple permissive policies are suboptimal for performance as each policy must be executed for every relevant query.' as description,
    format(
        'Table \`%s.%s\` has multiple permissive policies for role \`%s\` for action \`%s\`. Policies include \`%s\`',
        n.nspname,
        c.relname,
        r.rolname,
        act.cmd,
        array_agg(p.polname order by p.polname)
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies' as remediation,
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
    join pg_catalog.pg_class c
        on p.polrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    join pg_catalog.pg_roles r
        on p.polroles @> array[r.oid]
        or p.polroles = array[0::oid]
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e',
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
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and r.rolname not like 'pg_%'
    and r.rolname not like 'supabase%admin'
    and not r.rolbypassrls
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relname,
    r.rolname,
    act.cmd
having
    count(1) > 1)
union all
(
select
    'policy_exists_rls_disabled' as name,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.' as description,
    format(
        'Table \`%s.%s\` has RLS policies but RLS is not enabled on the table. Policies include %s.',
        n.nspname,
        c.relname,
        array_agg(p.polname order by p.polname)
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'policy_exists_rls_disabled_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_policy p
    join pg_catalog.pg_class c
        on p.polrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'r' -- regular tables
    and n.nspname not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    -- RLS is disabled
    and not c.relrowsecurity
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relname)
union all
(
select
    'rls_enabled_no_policy' as name,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects cases where row level security (RLS) has been enabled on a table but no RLS policies have been created.' as description,
    format(
        'Table \`%s.%s\` has RLS enabled, but no policies exist',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'rls_enabled_no_policy_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    left join pg_catalog.pg_policy p
        on p.polrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'r' -- regular tables
    and n.nspname not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    -- RLS is enabled
    and c.relrowsecurity
    and p.polname is null
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relname)
union all
(
select
    'duplicate_index' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    'Detects cases where two ore more identical indexes exist.' as description,
    format(
        'Table \`%s.%s\` has identical indexes %s. Drop all except one of them',
        n.nspname,
        c.relname,
        array_agg(pi.indexname order by pi.indexname)
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', case
            when c.relkind = 'r' then 'table'
            when c.relkind = 'm' then 'materialized view'
            else 'ERROR'
        end,
        'indexes', array_agg(pi.indexname order by pi.indexname)
    ) as metadata,
    format(
        'duplicate_index_%s_%s_%s',
        n.nspname,
        c.relname,
        array_agg(pi.indexname order by pi.indexname)
    ) as cache_key
from
    pg_catalog.pg_indexes pi
    join pg_catalog.pg_namespace n
        on n.nspname  = pi.schemaname
    join pg_catalog.pg_class c
        on pi.tablename = c.relname
        and n.oid = c.relnamespace
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind in ('r', 'm') -- tables and materialized views
    and n.nspname not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relkind,
    c.relname,
    replace(pi.indexdef, pi.indexname, '')
having
    count(*) > 1)
union all
(
select
    'security_definer_view' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects views that are SECURITY DEFINER meaning that they ignore row level security (RLS) policies.' as description,
    format(
        'View \`%s.%s\` is SECURITY DEFINER',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'view'
    ) as metadata,
    format(
        'security_definer_view_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'v'
    and n.nspname = 'public'
    and dep.objid is null -- exclude views owned by extensions
	and not (
		lower(coalesce(c.reloptions::text,'{}'))::text[]
		&& array[
			'security_invoker=1',
			'security_invoker=true',
			'security_invoker=yes',
			'security_invoker=on'
		]
	))
union all
(
select
    'function_search_path_mutable' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects functions with a mutable search_path parameter which could fail to execute successfully for some roles.' as description,
    format(
        'Function \`%s.%s\` has a role mutable search_path',
        n.nspname,
        p.proname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', p.proname,
        'type', 'function'
    ) as metadata,
    format(
        'function_search_path_mutable_%s_%s_%s',
        n.nspname,
        p.proname,
        md5(p.prosrc) -- required when function is polymorphic
    ) as cache_key
from
    pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n
        on p.pronamespace = n.oid
    left join pg_catalog.pg_depend dep
        on p.oid = dep.objid
        and dep.deptype = 'e'
where
    n.nspname not in (
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude functions owned by extensions
    -- Search path not set to ''
    and not coalesce(p.proconfig, '{}') && array['search_path=""'])
union all
(
select
    'rls_disabled_in_public' as name,
    'ERROR' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects cases where row level security (RLS) has not been enabled on a table in the \`public\` schema.' as description,
    format(
        'Table \`%s.%s\` is public, but RLS has not been enabled.',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'rls_disabled_in_public_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
where
    c.relkind = 'r' -- regular tables
    and n.nspname = 'public'
    -- RLS is disabled
    and not c.relrowsecurity)
union all
(
select
    'extension_in_public' as name,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Detects extensions installed in the \`public\` schema.' as description,
    format(
        'Extension \`%s\` is installed in the public schema. Move it to another schema.',
        pe.extname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public' as remediation,
    jsonb_build_object(
        'schema', pe.extnamespace::regnamespace,
        'name', pe.extname,
        'type', 'extension'
    ) as metadata,
    format(
        'extension_in_public_%s',
        pe.extname
    ) as cache_key
from
    pg_catalog.pg_extension pe
where
    -- plpgsql is installed by default in public and outside user control
    -- confirmed safe
    pe.extname not in ('plpgsql')
    and pe.extnamespace::regnamespace::text = 'public')`.trim()

// Array of all lint rules we handle right now.
export const LINT_TYPES = [
  'unindexed_foreign_keys',
  'auth_users_exposed',
  'auth_rls_initplan',
  'no_primary_key',
  'unused_index',
  'multiple_permissive_policies',
  'policy_exists_rls_disabled',
  'rls_enabled_no_policy',
  'duplicate_index',
  'security_definer_view',
  'function_search_path_mutable',
  'rls_disabled_in_public',
  'extension_in_public',
] as const

export type LINT_TYPES = (typeof LINT_TYPES)[number]

export type Lint = {
  name: LINT_TYPES
  level: 'ERROR' | 'WARN' | 'INFO'
  facing: string
  categories: ['PERFORMANCE' | 'SECURITY']
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
