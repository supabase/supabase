import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

/**
 * Generates SQL to find top 5 SELECT queries involving a table and run them through index_advisor
 */
export function getTableIndexAdvisorSql(schema: string, table: string): SafeSqlFragment {
  // Escape regex metacharacters so schema/table names are matched literally in PostgreSQL regex
  const regexSchema = schema.toLowerCase().replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
  const regexTable = table.toLowerCase().replace(/[.+*?^${}()|[\]\\]/g, '\\$&')

  const tablePattern = literal(`(^|[^a-z0-9_$])${regexSchema}[.]${regexTable}($|[^a-z0-9_$])`)
  const fromPattern = literal(`(^|[^a-z0-9_$])from[[:space:]]+${regexTable}($|[^a-z0-9_$])`)
  const joinPattern = literal(`(^|[^a-z0-9_$])join[[:space:]]+${regexTable}($|[^a-z0-9_$])`)

  return safeSql`
-- Get top 5 SELECT queries involving this table and run through index_advisor
set search_path to public, extensions;

with top_queries as (
  select
    statements.query,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  where
    -- Filter for SELECT queries only (index_advisor only works with SELECT)
    (lower(statements.query) like 'select%' or lower(statements.query) like 'with pgrst%')
    -- Filter for queries involving our table. Use regex word boundaries so that e.g.
    -- looking for table "orders" does not match queries on "orders_items".
    and (
      lower(statements.query) ~ ${tablePattern}
      or lower(statements.query) ~ ${fromPattern}
      or lower(statements.query) ~ ${joinPattern}
    )
    -- Exclude system queries
    and statements.query not like '%pg_catalog%'
    and statements.query not like '%information_schema%'
  order by statements.calls desc
  limit 5
)
select
  tq.query,
  tq.calls,
  tq.total_time,
  tq.mean_time,
  coalesce(ia.index_statements, '{}') as index_statements,
  coalesce((ia.startup_cost_before)::numeric, 0) as startup_cost_before,
  coalesce((ia.startup_cost_after)::numeric, 0) as startup_cost_after,
  coalesce((ia.total_cost_before)::numeric, 0) as total_cost_before,
  coalesce((ia.total_cost_after)::numeric, 0) as total_cost_after
from top_queries tq
left join lateral (
  select * from index_advisor(tq.query)
) ia on true;`
}
