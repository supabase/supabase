-- =============================================================================
-- Seed system rules from splinter lints (24 rules)
-- Each rule's sql_query is the body of the corresponding splinter lint view,
-- wrapped to return rows when the lint condition is detected.
-- =============================================================================

-- 0001: Unindexed Foreign Keys
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('unindexed_foreign_keys', 'Unindexed Foreign Keys', 'Identifies foreign key constraints without a covering index, which can impact database performance.', 'performance', 'sql', 'info', 'INFO', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys',
$lint$
set local search_path = '';
with foreign_keys as (
    select cl.relnamespace::regnamespace::text as schema_name, cl.relname as table_name, cl.oid as table_oid, ct.conname as fkey_name, ct.conkey as col_attnums
    from pg_catalog.pg_constraint ct join pg_catalog.pg_class cl on ct.conrelid = cl.oid left join pg_catalog.pg_depend d on d.objid = cl.oid and d.deptype = 'e'
    where ct.contype = 'f' and d.objid is null and cl.relnamespace::regnamespace::text not in ('pg_catalog','information_schema','auth','storage','vault','extensions')
),
index_ as (
    select pi.indrelid as table_oid, indexrelid::regclass as index_, string_to_array(indkey::text, ' ')::smallint[] as col_attnums
    from pg_catalog.pg_index pi where indisvalid
)
select 'unindexed_foreign_keys' as name, fk.schema_name, fk.table_name, fk.fkey_name
from foreign_keys fk left join index_ idx on fk.table_oid = idx.table_oid and fk.col_attnums = idx.col_attnums[1:array_length(fk.col_attnums, 1)]
left join pg_catalog.pg_depend dep on idx.table_oid = dep.objid and dep.deptype = 'e'
where idx.index_ is null and dep.objid is null
and fk.schema_name not in ('_timescaledb_cache','_timescaledb_catalog','_timescaledb_config','_timescaledb_internal','auth','cron','extensions','graphql','graphql_public','information_schema','net','pgmq','pgroonga','pgsodium','pgsodium_masks','pgtle','pgbouncer','pg_catalog','realtime','repack','storage','supabase_functions','supabase_migrations','tiger','topology','vault')
$lint$);

-- 0002: Exposed Auth Users
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('auth_users_exposed', 'Exposed Auth Users', 'Detects if auth.users is exposed to anon or authenticated roles via a view or materialized view in schemas exposed to PostgREST.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed',
$lint$
set local search_path = '';
select 'auth_users_exposed' as name, n.nspname as schema_name, c.relname as view_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid join pg_catalog.pg_depend d on d.refobjid = c.oid
where c.relkind in ('v','m') and d.deptype = 'n'
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
and exists (select 1 from pg_catalog.pg_depend dd join pg_catalog.pg_rewrite rw on dd.objid = rw.oid where rw.ev_class = c.oid and dd.refobjid = 'auth.users'::regclass)
$lint$);

-- 0003: Auth RLS InitPlan
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('auth_rls_initplan', 'Auth RLS Initialization Plan', 'Detects if calls to current_setting() and auth.<function>() in RLS policies are being unnecessarily re-evaluated for each row.', 'performance', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan',
$lint$
set local search_path = '';
select 'auth_rls_initplan' as name, n.nspname as schema_name, c.relname as table_name, p.polname as policy_name
from pg_catalog.pg_policy p join pg_catalog.pg_class c on p.polrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron','graphql','graphql_public','net','pgsodium','pgsodium_masks','realtime','repack','supabase_functions','supabase_migrations')
and (pg_get_expr(p.polqual, p.polrelid) ~* '(auth\.(uid|jwt|role|email)\(\)|current_setting\()' or pg_get_expr(p.polwithcheck, p.polrelid) ~* '(auth\.(uid|jwt|role|email)\(\)|current_setting\()')
and (pg_get_expr(p.polqual, p.polrelid) !~* '\(\s*select\s' and pg_get_expr(p.polwithcheck, p.polrelid) !~* '\(\s*select\s')
$lint$);

-- 0004: No Primary Key
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('no_primary_key', 'No Primary Key', 'Detects if a table does not have a primary key. Tables without a primary key can be inefficient to interact with at scale.', 'performance', 'sql', 'info', 'INFO', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0004_no_primary_key',
$lint$
set local search_path = '';
select 'no_primary_key' as name, n.nspname as schema_name, c.relname as table_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'r'
and not exists (select 1 from pg_catalog.pg_constraint con where con.conrelid = c.oid and con.contype = 'p')
and n.nspname not in ('_timescaledb_cache','_timescaledb_catalog','_timescaledb_config','_timescaledb_internal','auth','cron','extensions','graphql','graphql_public','information_schema','net','pgmq','pgroonga','pgsodium','pgsodium_masks','pgtle','pgbouncer','pg_catalog','realtime','repack','storage','supabase_functions','supabase_migrations','tiger','topology','vault')
$lint$);

-- 0005: Unused Index
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('unused_index', 'Unused Index', 'Detects if an index has never been used and may be a candidate for removal.', 'performance', 'sql', 'info', 'INFO', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index',
$lint$
set local search_path = '';
select 'unused_index' as name, s.schemaname as schema_name, s.relname as table_name, s.indexrelname as index_name
from pg_catalog.pg_stat_user_indexes s join pg_catalog.pg_index i on s.indexrelid = i.indexrelid
where s.idx_scan = 0 and not i.indisunique and not i.indisprimary
and s.schemaname not in ('_timescaledb_cache','_timescaledb_catalog','_timescaledb_config','_timescaledb_internal','auth','cron','extensions','graphql','graphql_public','information_schema','net','pgmq','pgroonga','pgsodium','pgsodium_masks','pgtle','pgbouncer','pg_catalog','realtime','repack','storage','supabase_functions','supabase_migrations','tiger','topology','vault')
$lint$);

-- 0006: Multiple Permissive Policies
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('multiple_permissive_policies', 'Multiple Permissive Policies', 'Detects if multiple permissive row level security policies are present on a table for the same role and action. Multiple permissive policies are suboptimal for performance.', 'performance', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies',
$lint$
set local search_path = '';
select 'multiple_permissive_policies' as name, n.nspname as schema_name, c.relname as table_name, p.polcmd::text as command, count(*) as policy_count
from pg_catalog.pg_policy p join pg_catalog.pg_class c on p.polrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where p.polpermissive = true
and n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron','graphql','graphql_public','net','pgsodium','pgsodium_masks','realtime','repack','supabase_functions','supabase_migrations')
group by n.nspname, c.relname, p.polcmd, p.polroles having count(*) > 1
$lint$);

-- 0007: Policy Exists RLS Disabled
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('policy_exists_rls_disabled', 'Policy Exists RLS Disabled', 'Detects cases where row level security policies have been created, but RLS has not been enabled for the underlying table.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled',
$lint$
set local search_path = '';
select 'policy_exists_rls_disabled' as name, n.nspname as schema_name, c.relname as table_name
from pg_catalog.pg_policy p join pg_catalog.pg_class c on p.polrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where not c.relrowsecurity
and n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron','graphql','graphql_public','net','pgsodium','pgsodium_masks','realtime','repack','supabase_functions','supabase_migrations')
group by n.nspname, c.relname
$lint$);

-- 0008: RLS Enabled No Policy
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('rls_enabled_no_policy', 'RLS Enabled No Policy', 'Detects cases where row level security has been enabled on a table but no RLS policies have been created.', 'security', 'sql', 'info', 'INFO', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy',
$lint$
set local search_path = '';
select 'rls_enabled_no_policy' as name, n.nspname as schema_name, c.relname as table_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'r' and c.relrowsecurity
and not exists (select 1 from pg_catalog.pg_policy p where p.polrelid = c.oid)
and n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron','graphql','graphql_public','net','pgsodium','pgsodium_masks','realtime','repack','supabase_functions','supabase_migrations')
$lint$);

-- 0009: Duplicate Index
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('duplicate_index', 'Duplicate Index', 'Detects cases where two or more identical indexes exist.', 'performance', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index',
$lint$
set local search_path = '';
select 'duplicate_index' as name, n.nspname as schema_name, ct.relname as table_name, ci.relname as index_name
from pg_catalog.pg_index i1 join pg_catalog.pg_index i2 on i1.indrelid = i2.indrelid and i1.indexrelid < i2.indexrelid and i1.indkey = i2.indkey
join pg_catalog.pg_class ci on i1.indexrelid = ci.oid join pg_catalog.pg_class ct on i1.indrelid = ct.oid join pg_catalog.pg_namespace n on ct.relnamespace = n.oid
where n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron','graphql','graphql_public','net','pgsodium','pgsodium_masks','realtime','repack','supabase_functions','supabase_migrations')
$lint$);

-- 0010: Security Definer View
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('security_definer_view', 'Security Definer View', 'Detects views defined with the SECURITY DEFINER property accessible to anon or authenticated roles.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view',
$lint$
set local search_path = '';
select 'security_definer_view' as name, n.nspname as schema_name, c.relname as view_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'v'
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
and not coalesce((pg_catalog.pg_options_to_table(c.reloptions)).option_value = 'on', false)
$lint$);

-- 0011: Function Search Path Mutable
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('function_search_path_mutable', 'Function Search Path Mutable', 'Detects functions where the search_path parameter is not set.', 'security', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable',
$lint$
set local search_path = '';
select 'function_search_path_mutable' as name, n.nspname as schema_name, p.proname as function_name
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on p.pronamespace = n.oid
where n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron','graphql','graphql_public','net','pgsodium','pgsodium_masks','pgtle','realtime','repack','supabase_functions','supabase_migrations')
and not p.proisstrict
and p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')
$lint$);

-- 0013: RLS Disabled in Public
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('rls_disabled_in_public', 'RLS Disabled in Public', 'Detects cases where row level security has not been enabled on tables in schemas exposed to PostgREST.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public',
$lint$
set local search_path = '';
select 'rls_disabled_in_public' as name, n.nspname as schema_name, c.relname as table_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'r' and not c.relrowsecurity
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
and n.nspname not in ('_timescaledb_cache','_timescaledb_catalog','_timescaledb_config','_timescaledb_internal','auth','cron','extensions','graphql','graphql_public','information_schema','net','pgmq','pgroonga','pgsodium','pgsodium_masks','pgtle','pgbouncer','pg_catalog','realtime','repack','storage','supabase_functions','supabase_migrations','tiger','topology','vault')
$lint$);

-- 0014: Extension in Public
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('extension_in_public', 'Extension in Public', 'Detects extensions installed in the public schema.', 'security', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public',
$lint$
set local search_path = '';
select 'extension_in_public' as name, e.extname as extension_name, n.nspname as schema_name
from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on e.extnamespace = n.oid
where n.nspname = 'public'
$lint$);

-- 0015: RLS References User Metadata
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('rls_references_user_metadata', 'RLS References User Metadata', 'Detects when Supabase Auth user_metadata is referenced insecurely in a row level security policy.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0015_rls_references_user_metadata',
$lint$
set local search_path = '';
select 'rls_references_user_metadata' as name, n.nspname as schema_name, c.relname as table_name, p.polname as policy_name
from pg_catalog.pg_policy p join pg_catalog.pg_class c on p.polrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where (pg_get_expr(p.polqual, p.polrelid) ~* 'user_metadata' or pg_get_expr(p.polwithcheck, p.polrelid) ~* 'user_metadata')
and n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions')
$lint$);

-- 0016: Materialized View in API
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('materialized_view_in_api', 'Materialized View in API', 'Detects materialized views that are accessible over the Data APIs.', 'security', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api',
$lint$
set local search_path = '';
select 'materialized_view_in_api' as name, n.nspname as schema_name, c.relname as view_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'm'
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
$lint$);

-- 0017: Foreign Table in API
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('foreign_table_in_api', 'Foreign Table in API', 'Detects foreign tables that are accessible over APIs. Foreign tables do not respect row level security policies.', 'security', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api',
$lint$
set local search_path = '';
select 'foreign_table_in_api' as name, n.nspname as schema_name, c.relname as table_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'f'
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
$lint$);

-- 0018: Unsupported Reg Types
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('unsupported_reg_types', 'Unsupported Reg Types', 'Identifies columns using unsupported reg* types outside pg_catalog schema, which prevents database upgrades using pg_upgrade.', 'security', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=unsupported_reg_types',
$lint$
set local search_path = '';
select 'unsupported_reg_types' as name, n.nspname as schema_name, c.relname as table_name, a.attname as column_name, t.typname as type_name
from pg_catalog.pg_attribute a join pg_catalog.pg_class c on a.attrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid join pg_catalog.pg_type t on a.atttypid = t.oid
where t.typname in ('regproc','regprocedure','regoper','regoperator','regclass','regcollation','regtype','regconfig','regdictionary','regnamespace','regrole')
and n.nspname != 'pg_catalog' and a.attnum > 0 and not a.attisdropped
$lint$);

-- 0019: Insecure Queue Exposed in API
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('insecure_queue_exposed_in_api', 'Insecure Queue Exposed in API', 'Detects cases where an insecure Queue is exposed over Data APIs.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0019_insecure_queue_exposed_in_api',
$lint$
set local search_path = '';
select 'insecure_queue_exposed_in_api' as name, n.nspname as schema_name, c.relname as table_name
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'r' and c.relname like 'q\_%' and n.nspname = 'pgmq'
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and not c.relrowsecurity
$lint$);

-- 0020: Table Bloat
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('table_bloat', 'Table Bloat', 'Detects if a table has excess bloat and may benefit from maintenance operations like vacuum full or cluster.', 'performance', 'sql', 'info', 'INFO', '0 */12 * * *', 43200, true, 'Consider running vacuum full (WARNING: incurs downtime) and tweaking autovacuum settings to reduce bloat.',
$lint$
set local search_path = '';
with constants as (
    select current_setting('block_size')::numeric as bs, 23 as hdr, 8 as ma
),
bloat_info as (
    select
        n.nspname as schema_name, c.relname as table_name,
        pg_catalog.pg_table_size(c.oid) as real_size,
        (c.reltuples * (hdr + ma - (case when hdr % ma = 0 then ma else hdr % ma end) +
            coalesce((select sum(pg_catalog.pg_column_size(a.attnum)) from pg_catalog.pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped), 0)
        ))::bigint as expected_size
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on c.relnamespace = n.oid, constants
    where c.relkind = 'r' and c.reltuples > 1000
    and n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions','cron')
)
select 'table_bloat' as name, schema_name, table_name,
  pg_catalog.pg_size_pretty(real_size) as table_size,
  case when expected_size > 0 then round(100.0 * (real_size - expected_size) / real_size, 1) else 0 end as bloat_pct
from bloat_info
where expected_size > 0 and real_size > expected_size * 2 and real_size > 10485760
$lint$);

-- 0021: Foreign Key to Auth Unique Constraint
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('fkey_to_auth_unique', 'Foreign Key to Auth Unique Constraint', 'Detects user defined foreign keys to unique constraints in the auth schema.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'Drop the foreign key constraint that references the auth schema.',
$lint$
set local search_path = '';
select 'fkey_to_auth_unique' as name, n.nspname as schema_name, c.relname as table_name, ct.conname as constraint_name
from pg_catalog.pg_constraint ct join pg_catalog.pg_class c on ct.conrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
join pg_catalog.pg_class rc on ct.confrelid = rc.oid join pg_catalog.pg_namespace rn on rc.relnamespace = rn.oid
where ct.contype = 'f' and rn.nspname = 'auth'
and exists (select 1 from pg_catalog.pg_constraint uc where uc.conrelid = ct.confrelid and uc.contype = 'u' and uc.conkey = ct.confkey)
and not exists (select 1 from pg_catalog.pg_constraint pk where pk.conrelid = ct.confrelid and pk.contype = 'p' and pk.conkey = ct.confkey)
$lint$);

-- 0022: Extension Versions Outdated
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('extension_versions_outdated', 'Extension Versions Outdated', 'Detects extensions that are not using the default (recommended) version.', 'security', 'sql', 'warning', 'WARN', '0 */12 * * *', 43200, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0022_extension_versions_outdated',
$lint$
set local search_path = '';
select 'extension_versions_outdated' as name, e.extname as extension_name, e.extversion as installed_version, ae.default_version
from pg_catalog.pg_extension e join pg_catalog.pg_available_extensions ae on e.extname = ae.name
where e.extversion != ae.default_version
$lint$);

-- 0023: Sensitive Columns Exposed
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('sensitive_columns_exposed', 'Sensitive Columns Exposed', 'Detects tables exposed via API that contain columns with potentially sensitive data without RLS protection.', 'security', 'sql', 'critical', 'ERROR', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0023_sensitive_columns_exposed',
$lint$
set local search_path = '';
select 'sensitive_columns_exposed' as name, n.nspname as schema_name, c.relname as table_name, a.attname as column_name
from pg_catalog.pg_attribute a join pg_catalog.pg_class c on a.attrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where c.relkind = 'r' and a.attnum > 0 and not a.attisdropped and not c.relrowsecurity
and (pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'))
and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
and lower(a.attname) ~ '(password|passwd|secret|token|api_key|apikey|access_key|private_key|credit_card|creditcard|card_number|cvv|ssn|social_security|sin_number|tax_id)'
$lint$);

-- 0024: RLS Policy Always True
insert into _supabase_advisors.rules (name, title, description, category, source, severity, level, schedule, cooldown_seconds, is_system, remediation, sql_query) values
('rls_policy_always_true', 'Permissive RLS Policy', 'Detects RLS policies that use overly permissive expressions like USING (true) or WITH CHECK (true) for UPDATE, DELETE, or INSERT operations.', 'security', 'sql', 'warning', 'WARN', '0 */6 * * *', 21600, true, 'https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy',
$lint$
set local search_path = '';
select 'rls_policy_always_true' as name, n.nspname as schema_name, c.relname as table_name, p.polname as policy_name, p.polcmd::text as command
from pg_catalog.pg_policy p join pg_catalog.pg_class c on p.polrelid = c.oid join pg_catalog.pg_namespace n on c.relnamespace = n.oid
where p.polpermissive = true and p.polcmd != '*'::"char" and p.polcmd != 'r'::"char"
and (pg_get_expr(p.polqual, p.polrelid) = 'true' or pg_get_expr(p.polwithcheck, p.polrelid) = 'true')
and n.nspname not in ('pg_catalog','information_schema','auth','storage','vault','extensions')
$lint$);

-- =============================================================================
-- Seed default agents
-- =============================================================================

insert into _supabase_advisors.agents (name, summary, system_prompt, tools) values
('Security Advisor', 'Analyzes security issues and suggests RLS policies, auth fixes, and security hardening.', 'You are a Supabase security advisor. When asked about alerts or issues, analyze the security implications and suggest specific fixes. Always provide SQL statements users can run to fix problems. Focus on RLS policies, auth configuration, and API exposure.', array['listAlerts', 'getAlert', 'commentOnAlert', 'executeLogsQuery']),
('Performance Advisor', 'Analyzes performance issues and suggests index optimizations, query improvements, and configuration tuning.', 'You are a Supabase performance advisor. When asked about alerts or issues, analyze performance implications and suggest specific optimizations. Provide index creation SQL, query rewrites, and configuration recommendations. Focus on query performance, index usage, and resource utilization.', array['listAlerts', 'getAlert', 'commentOnAlert', 'executeLogsQuery', 'getDiskUtilization']),
('General Advisor', 'General-purpose advisor that can analyze any type of issue and coordinate with specialized advisors.', 'You are a general Supabase advisor. You help users understand their project health, triage issues, and coordinate fixes. You can analyze any type of issue - security, performance, or operational. Provide clear, actionable recommendations.', array['listAlerts', 'getAlert', 'createAlert', 'commentOnAlert', 'listAgents', 'listTasks', 'executeLogsQuery', 'getDiskUtilization']);
