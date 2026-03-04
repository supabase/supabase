export interface RulePreset {
  name: string
  title: string
  description: string
  category: string
  source: string
  severity: 'critical' | 'warning' | 'info'
  level: 'ERROR' | 'WARN' | 'INFO'
  schedule: string
  cooldown_seconds: number
  sql_query: string
  is_enabled: boolean
}

export interface RuleTemplate {
  id: string
  name: string
  description: string
  category: 'security' | 'performance' | 'cost'
  rules: RulePreset[]
}

export const SECURITY_TEMPLATE: RuleTemplate = {
  id: 'security-essentials',
  name: 'Security Essentials',
  description: 'Check for common security misconfigurations like missing RLS, exposed auth tables, and leaked secrets.',
  category: 'security',
  rules: [
    {
      name: 'no_rls_enabled',
      title: 'Tables without RLS',
      description: 'Detects tables in the public schema that do not have Row Level Security enabled.',
      category: 'security',
      source: 'sql',
      severity: 'critical',
      level: 'ERROR',
      schedule: '0 */6 * * *',
      cooldown_seconds: 3600,
      sql_query: `SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT tablename FROM pg_tables t JOIN pg_class c ON t.tablename = c.relname WHERE c.relrowsecurity = true)`,
      is_enabled: true,
    },
    {
      name: 'auth_users_exposed',
      title: 'Auth users table exposed',
      description: 'Checks if the auth.users table is accessible via the API.',
      category: 'security',
      source: 'sql',
      severity: 'critical',
      level: 'ERROR',
      schedule: '0 */6 * * *',
      cooldown_seconds: 3600,
      sql_query: `SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND definition LIKE '%auth.users%')`,
      is_enabled: true,
    },
    {
      name: 'policy_exists_rls_disabled',
      title: 'Policy exists but RLS disabled',
      description: 'Tables with RLS policies defined but RLS not actually enabled.',
      category: 'security',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '0 */6 * * *',
      cooldown_seconds: 3600,
      sql_query: `SELECT c.relname FROM pg_class c JOIN pg_policy p ON p.polrelid = c.oid WHERE NOT c.relrowsecurity GROUP BY c.relname`,
      is_enabled: true,
    },
    {
      name: 'function_search_path',
      title: 'Functions with mutable search_path',
      description: 'Functions that do not have a fixed search_path, which can lead to search_path injection.',
      category: 'security',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '0 */12 * * *',
      cooldown_seconds: 7200,
      sql_query: `SELECT n.nspname, p.proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND NOT EXISTS (SELECT 1 FROM pg_proc_info WHERE oid = p.oid AND prosecdef AND proconfig @> ARRAY['search_path='])`,
      is_enabled: true,
    },
  ],
}

export const PERFORMANCE_TEMPLATE: RuleTemplate = {
  id: 'performance-monitor',
  name: 'Performance Monitor',
  description: 'Detect missing indexes, bloated tables, and other performance bottlenecks.',
  category: 'performance',
  rules: [
    {
      name: 'unindexed_foreign_keys',
      title: 'Unindexed foreign keys',
      description: 'Foreign key columns that lack an index, causing slow JOINs and cascading deletes.',
      category: 'performance',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '0 */12 * * *',
      cooldown_seconds: 7200,
      sql_query: `SELECT c.conrelid::regclass AS table_name, a.attname AS column_name FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) WHERE c.contype = 'f' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey))`,
      is_enabled: true,
    },
    {
      name: 'duplicate_indexes',
      title: 'Duplicate indexes',
      description: 'Indexes that are exact duplicates of other indexes, wasting storage and slowing writes.',
      category: 'performance',
      source: 'sql',
      severity: 'info',
      level: 'INFO',
      schedule: '0 0 * * 0',
      cooldown_seconds: 86400,
      sql_query: `SELECT pg_size_pretty(sum(pg_relation_size(idx))::bigint) as size, string_agg(idx::regclass::text, ', ') as indexes, (array_agg(idx::regclass))[1] as keep FROM (SELECT indexrelid::regclass AS idx, (indrelid::text || E'\\n' || indclass::text || E'\\n' || indkey::text || E'\\n' || coalesce(indexprs::text,'') || E'\\n' || coalesce(indpred::text,'')) AS key FROM pg_index) sub GROUP BY key HAVING count(*) > 1`,
      is_enabled: true,
    },
    {
      name: 'bloated_tables',
      title: 'Bloated tables',
      description: 'Tables with significant dead tuple bloat that may need vacuuming.',
      category: 'performance',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '0 0 * * *',
      cooldown_seconds: 86400,
      sql_query: `SELECT schemaname, relname, n_dead_tup, n_live_tup, round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct FROM pg_stat_user_tables WHERE n_dead_tup > 10000 AND round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 1) > 20`,
      is_enabled: true,
    },
    {
      name: 'cache_hit_ratio',
      title: 'Low cache hit ratio',
      description: 'Database cache hit ratio below 95%, indicating potential memory pressure.',
      category: 'performance',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '0 */6 * * *',
      cooldown_seconds: 3600,
      sql_query: `SELECT round(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) AS ratio FROM pg_statio_user_tables HAVING round(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) < 95`,
      is_enabled: true,
    },
  ],
}

export const COST_TEMPLATE: RuleTemplate = {
  id: 'cost-watcher',
  name: 'Cost Watcher',
  description: 'Monitor resource usage patterns that could lead to unexpected costs.',
  category: 'cost',
  rules: [
    {
      name: 'large_tables',
      title: 'Tables over 1GB',
      description: 'Tables exceeding 1GB in size that may impact storage costs.',
      category: 'performance',
      source: 'sql',
      severity: 'info',
      level: 'INFO',
      schedule: '0 0 * * 1',
      cooldown_seconds: 604800,
      sql_query: `SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') AND pg_total_relation_size(schemaname || '.' || tablename) > 1073741824 ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC`,
      is_enabled: true,
    },
    {
      name: 'high_connection_count',
      title: 'High connection count',
      description: 'Database connection count approaching the maximum limit.',
      category: 'performance',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '*/30 * * * *',
      cooldown_seconds: 1800,
      sql_query: `SELECT count(*) AS active_connections, current_setting('max_connections')::int AS max_connections FROM pg_stat_activity WHERE state != 'idle' HAVING count(*) > current_setting('max_connections')::int * 0.8`,
      is_enabled: true,
    },
  ],
}

export const ALL_TEMPLATES: RuleTemplate[] = [
  SECURITY_TEMPLATE,
  PERFORMANCE_TEMPLATE,
  COST_TEMPLATE,
]
