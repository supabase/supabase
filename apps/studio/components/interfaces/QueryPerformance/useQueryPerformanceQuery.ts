import { ident, literal } from '@supabase/pg-meta/src/pg-format'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import { PRESET_CONFIG } from '../Reports/Reports.constants'
import { Presets } from '../Reports/Reports.types'
import {
  QueryPerformanceRow,
  QueryPerformanceSort,
  QueryPerformanceSQLParams,
} from './QueryPerformance.types'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { executeSql } from '@/data/sql/execute-sql-query'
import useDbQuery from '@/hooks/analytics/useDbQuery'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

const VALID_SORT_COLUMNS: ReadonlySet<string> = new Set<QueryPerformanceSort['column']>([
  'query',
  'rolname',
  'total_time',
  'prop_total_time',
  'calls',
  'avg_rows',
  'max_time',
  'mean_time',
  'min_time',
])

export function generateQueryPerformanceSql({
  preset,
  orderBy,
  searchQuery = '',
  roles = [],
  sources = [],
  minCalls = 0,
  minTotalTime = 0,
  runIndexAdvisor = false,
  filterIndexAdvisor = false,
  page = 1,
  pageSize = 20,
}: QueryPerformanceSQLParams) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
  const safePageSize = Number.isFinite(pageSize)
    ? Math.min(Math.max(1, Math.floor(pageSize)), 100)
    : 20

  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  const isValidOrderBy =
    orderBy != null &&
    VALID_SORT_COLUMNS.has(orderBy.column) &&
    (orderBy.order === 'asc' || orderBy.order === 'desc')

  const orderBySql = isValidOrderBy
    ? `ORDER BY ${ident(orderBy!.column)} ${orderBy!.order}`
    : undefined

  const whereConditions = []
  if (roles.length > 0) {
    whereConditions.push(`auth.rolname in (${roles.map((r) => `${literal(r)}`).join(', ')})`)
  }
  if (searchQuery.length > 0) {
    whereConditions.push(`statements.query ~* ${literal(searchQuery)}`)
  }
  if (sources.includes('dashboard') && !sources.includes('non-dashboard')) {
    whereConditions.push(`statements.query ~* 'source: dashboard'`)
  }
  if (sources.includes('non-dashboard') && !sources.includes('dashboard')) {
    whereConditions.push(`statements.query !~* 'source: dashboard'`)
  }
  if (Number.isFinite(minCalls) && minCalls > 0) {
    whereConditions.push(`statements.calls >= ${minCalls}`)
  }
  if (Number.isFinite(minTotalTime) && minTotalTime > 0) {
    whereConditions.push(
      `(statements.total_exec_time + statements.total_plan_time) >= ${minTotalTime}`
    )
  }

  const whereSql = whereConditions.join(' AND ')

  const sql = baseSQL.sql(
    [],
    whereSql.length > 0 ? `WHERE ${whereSql}` : undefined,
    orderBySql,
    runIndexAdvisor,
    filterIndexAdvisor,
    safePage,
    safePageSize
  )

  return { sql, whereSql, orderBySql }
}

export const useQueryPerformanceQuery = (props: QueryPerformanceSQLParams) => {
  const { sql, whereSql, orderBySql } = generateQueryPerformanceSql(props)
  return useDbQuery({ sql, params: undefined, where: whereSql, orderBy: orderBySql })
}

export interface QueryPerformanceInfiniteHook {
  data: QueryPerformanceRow[] | undefined
  isLoading: boolean
  isRefetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: unknown
  fetchNextPage: () => void
  refetch: () => void
  resolvedSql: string
}

export const useQueryPerformanceInfiniteQuery = (
  props: Omit<QueryPerformanceSQLParams, 'page'>
): QueryPerformanceInfiniteHook => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: project?.ref })
  const connectionString = (databases || []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )?.connectionString

  // Clamp pageSize the same way generateQueryPerformanceSql does so getNextPageParam
  // and the queryKey are always consistent with the SQL actually executed.
  const rawPageSize = props.pageSize
  const safePageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(1, Math.floor(rawPageSize!)), 100)
    : 20
  const { sql: page1Sql } = generateQueryPerformanceSql({
    ...props,
    page: 1,
    pageSize: safePageSize,
  })

  // When a read-replica is selected, require its connection string before fetching.
  // Falling back to the primary's connection string would silently query the wrong database.
  const isPrimarySelected = !state.selectedDatabaseId || state.selectedDatabaseId === project?.ref
  const effectiveConnectionString = isPrimarySelected
    ? (connectionString ?? project?.connectionString)
    : connectionString

  const { data, isPending, isRefetching, isFetchingNextPage, hasNextPage, error, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [
        'projects',
        project?.ref,
        'query-performance-infinite',
        {
          ...props,
          pageSize: safePageSize,
          identifier: state.selectedDatabaseId,
          connectionString: effectiveConnectionString,
        },
      ],
      initialPageParam: 1,
      queryFn: ({ pageParam, signal }) => {
        const { sql } = generateQueryPerformanceSql({
          ...props,
          page: pageParam,
          pageSize: safePageSize,
        })
        return executeSql<QueryPerformanceRow[]>(
          {
            projectRef: project?.ref,
            connectionString: effectiveConnectionString,
            sql,
          },
          signal
        ).then((res) => res.result)
      },
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length < safePageSize ? undefined : allPages.length + 1
      },
      // Don't run until we have a connection string for the selected database.
      // For replicas this prevents a silent fallback to the primary before replicas load.
      // In self-hosted mode (IS_PLATFORM=false) there is no real connection string, so we
      // skip the check — executeSql works fine without one on self-hosted deployments.
      enabled: Boolean(project?.ref) && (!IS_PLATFORM || Boolean(effectiveConnectionString)),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })

  return {
    data: data?.pages.flatMap((page) => page) ?? undefined,
    isLoading: isPending,
    isRefetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    error,
    fetchNextPage,
    // Reset to page 1 instead of re-fetching all loaded pages, avoiding a burst
    // of N requests when the user clicks Refresh after scrolling through multiple pages.
    refetch: () =>
      queryClient.resetQueries({
        queryKey: ['projects', project?.ref, 'query-performance-infinite'],
        exact: false,
      }),
    resolvedSql: page1Sql,
  }
}
