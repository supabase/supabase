import { literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import {
  calculateDatabaseHealth,
  connectionsMetricsSchema,
  DATABASE_HEALTH_CONFIG,
  locksMetricsSchema,
  performanceMetricsSchema,
  transactionsMetricsSchema,
  vacuumMetricsSchema,
  type DatabaseHealthCategoryId,
  type DatabaseHealthCollection,
  type DatabaseHealthResult,
} from './database-health-score'
import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, UseCustomQueryOptions } from '@/types'

/**
 * Every group runs with its own short statement timeout so a health check can
 * never become the expensive query on someone's database.
 */
const {
  statementTimeout,
  idleInTransactionSeconds,
  longTransactionSeconds,
  deadTupleRatio,
  deadTupleMinimumRows,
  staleStatisticsDays,
  staleStatisticsMinimumChanges,
} = DATABASE_HEALTH_CONFIG.metrics

const HEALTH_CHECK_STATEMENT_TIMEOUT = safeSql`set local statement_timeout = ${literal(statementTimeout)};`

const connectionsSql = safeSql`
  ${HEALTH_CHECK_STATEMENT_TIMEOUT}
  select
    (select setting::int from pg_settings where name = 'max_connections') as max_connections,
    (select count(*)::int from pg_stat_activity) as total_connections,
    (count(*) filter (
      where state like 'idle in transaction%'
        and state_change < now() - make_interval(secs => ${literal(idleInTransactionSeconds)})
    ))::int as idle_in_transaction_sessions,
    (count(*) filter (
      where state <> 'idle'
        and xact_start < now() - make_interval(secs => ${literal(longTransactionSeconds)})
    ))::int as long_running_transactions
  from pg_stat_activity
  where datname = current_database();
`

const vacuumSql = safeSql`
  ${HEALTH_CHECK_STATEMENT_TIMEOUT}
  select
    count(*)::int as table_count,
    (count(*) filter (
      where t.n_live_tup + t.n_dead_tup >= ${literal(deadTupleMinimumRows)}
        and t.n_dead_tup::numeric / nullif(t.n_live_tup + t.n_dead_tup, 0) > ${literal(deadTupleRatio)}
    ))::int as dead_tuple_tables,
    (count(*) filter (
      where t.n_dead_tup >
        current_setting('autovacuum_vacuum_threshold')::numeric
        + current_setting('autovacuum_vacuum_scale_factor')::numeric * greatest(c.reltuples, 0)::numeric
    ))::int as tables_past_autovacuum_threshold,
    (count(*) filter (
      where t.n_mod_since_analyze >= ${literal(staleStatisticsMinimumChanges)}
        and coalesce(greatest(t.last_analyze, t.last_autoanalyze), '-infinity'::timestamptz)
            < now() - make_interval(days => ${literal(staleStatisticsDays)})
    ))::int as stale_statistics_tables,
    (count(*) filter (
      where c.reloptions && array['autovacuum_enabled=false', 'autovacuum_enabled=off']
    ))::int as autovacuum_disabled_tables
  from pg_stat_user_tables t
  join pg_class c on c.oid = t.relid;
`

const locksSql = safeSql`
  ${HEALTH_CHECK_STATEMENT_TIMEOUT}
  select
    (select count(*)::int from pg_locks where not granted) as ungranted_locks,
    (count(*) filter (where wait_event_type = 'Lock'))::int as sessions_waiting_on_locks,
    coalesce(
      max(extract(epoch from now() - state_change)) filter (where wait_event_type = 'Lock'),
      0
    )::int as longest_lock_wait_seconds
  from pg_stat_activity
  where datname = current_database();
`

const transactionsSql = safeSql`
  ${HEALTH_CHECK_STATEMENT_TIMEOUT}
  select
    (select max(age(datfrozenxid))::bigint from pg_database) as max_database_xid_age,
    (
      select coalesce(max(age(relfrozenxid)), 0)::bigint
      from pg_class
      where relkind in ('r', 'm', 't') and relfrozenxid <> 0
    ) as max_relation_xid_age,
    (select setting from pg_settings where name = 'autovacuum') as autovacuum,
    (select setting from pg_settings where name = 'track_counts') as track_counts,
    (
      select setting::bigint
      from pg_settings
      where name = 'autovacuum_freeze_max_age'
    ) as autovacuum_freeze_max_age,
    (
      select coalesce(max(extract(epoch from now() - xact_start)), 0)::int
      from pg_stat_activity
      where state <> 'idle' and xact_start is not null
    ) as oldest_transaction_seconds;
`

const performanceSql = safeSql`
  ${HEALTH_CHECK_STATEMENT_TIMEOUT}
  select
    (
      select sum(blks_hit)::numeric / nullif(sum(blks_hit + blks_read), 0)
      from pg_stat_database
      where datname = current_database()
    )::float8 as cache_hit_ratio,
    (
      select coalesce(sum(blks_hit + blks_read), 0)::bigint
      from pg_stat_database
      where datname = current_database()
    ) as total_blocks_accessed,
    (select setting from pg_settings where name = 'track_io_timing') as track_io_timing,
    (
      select sum(n_tup_hot_upd)::numeric / nullif(sum(n_tup_upd), 0)
      from pg_stat_user_tables
    )::float8 as hot_update_ratio,
    (select coalesce(sum(n_tup_upd), 0)::bigint from pg_stat_user_tables) as total_updates;
`

const HEALTH_CHECK_GROUPS = [
  { id: 'connections', sql: connectionsSql, schema: connectionsMetricsSchema },
  { id: 'vacuum', sql: vacuumSql, schema: vacuumMetricsSchema },
  { id: 'locks', sql: locksSql, schema: locksMetricsSchema },
  { id: 'transactions', sql: transactionsSql, schema: transactionsMetricsSchema },
  { id: 'performance', sql: performanceSql, schema: performanceMetricsSchema },
] satisfies { id: DatabaseHealthCategoryId; sql: SafeSqlFragment; schema: z.ZodTypeAny }[]

export type DatabaseHealthVariables = {
  projectRef?: string
  connectionString?: string | null
}

async function collectHealthGroup(
  group: (typeof HEALTH_CHECK_GROUPS)[number],
  { projectRef, connectionString }: DatabaseHealthVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: group.sql,
      queryKey: ['database-health', group.id],
      handleError: (error) => {
        throw error
      },
    },
    signal
  )

  const parsed = group.schema.safeParse(result?.[0])
  if (!parsed.success) throw new Error(`Unexpected shape for ${group.id} metrics`)

  return parsed.data
}

export async function getDatabaseHealth(
  variables: DatabaseHealthVariables,
  signal?: AbortSignal
): Promise<{ result: DatabaseHealthResult; collectedAt: string }> {
  const outcomes = await Promise.allSettled(
    HEALTH_CHECK_GROUPS.map((group) => collectHealthGroup(group, variables, signal))
  )

  const collection = Object.fromEntries(
    HEALTH_CHECK_GROUPS.map((group, index) => {
      const outcome = outcomes[index]
      if (outcome.status === 'fulfilled') {
        return [group.id, { status: 'collected', metrics: outcome.value }]
      }
      return [
        group.id,
        {
          status: 'unavailable',
          error: outcome.reason instanceof Error ? outcome.reason.message : 'Query failed',
        },
      ]
    })
  ) as DatabaseHealthCollection

  return { result: calculateDatabaseHealth(collection), collectedAt: new Date().toISOString() }
}

export type DatabaseHealthData = Awaited<ReturnType<typeof getDatabaseHealth>>
export type DatabaseHealthError = ResponseError

export const useDatabaseHealthQuery = <TData = DatabaseHealthData>(
  { projectRef, connectionString }: DatabaseHealthVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseHealthData, DatabaseHealthError, TData> = {}
) =>
  useQuery<DatabaseHealthData, DatabaseHealthError, TData>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: databaseKeys.databaseHealth(projectRef),
    queryFn: ({ signal }) => getDatabaseHealth({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    staleTime: 60 * 1000,
    ...options,
  })
