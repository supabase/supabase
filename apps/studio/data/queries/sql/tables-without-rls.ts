import { quoteLiteral } from '@/lib/pg-format'

/**
 * Builds a SQL query that returns entities exposed through the Data API that
 * have potential security issues:
 *
 * - Tables without Row Level Security (lint 0013)
 * - Foreign tables accessible by anon/authenticated (lint 0017)
 * - Materialized views accessible by anon/authenticated (lint 0016)
 * - Views without SECURITY INVOKER on PG 15+ (lint 0010)
 *
 * Checks against the _target_ schemas rather than the currently active
 * PostgREST config, so it works correctly when enabling the Data API.
 */
export const unsafeEntitiesInApiSql = (schemas: Array<string>) => {
  const schemaList = schemas.map(quoteLiteral).join(', ')

  return /* SQL */ `
    select
      n.nspname as schema,
      c.relname as name,
      case c.relkind
        when 'r' then 'table'
        when 'f' then 'foreign table'
        when 'm' then 'materialized view'
        when 'v' then 'view'
      end as type
    from
      pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on c.relnamespace = n.oid
      left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
    where
      (
        pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
      )
      and n.nspname in (${schemaList})
      and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config',
        '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql',
        'graphql_public', 'information_schema', 'net', 'pgmq', 'pgroonga',
        'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog',
        'realtime', 'repack', 'storage', 'supabase_functions',
        'supabase_migrations', 'tiger', 'topology', 'vault'
      )
      and dep.objid is null
      and (
        -- Tables without RLS
        (c.relkind = 'r' and not c.relrowsecurity)
        -- Foreign tables (RLS not supported)
        or c.relkind = 'f'
        -- Materialized views (RLS not supported)
        or c.relkind = 'm'
        -- Views without security invoker (PG 15+)
        or (
          c.relkind = 'v'
          and substring(pg_catalog.version() from 'PostgreSQL ([0-9]+)') >= '15'
          and not (
            lower(coalesce(c.reloptions::text, '{}'))::text[]
            && array[
              'security_invoker=1',
              'security_invoker=true',
              'security_invoker=yes',
              'security_invoker=on'
            ]
          )
        )
      )
    order by n.nspname, c.relname
  `
}
