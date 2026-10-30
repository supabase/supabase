import { useQueries } from '@tanstack/react-query'
import { FeatureFlagContext, useFlag, useParams } from 'common'
import isEqual from 'lodash/isEqual'
import { useContext, useState } from 'react'

import {
  PRESET_CONFIG,
  REPORTS_DATEPICKER_HELPERS,
} from '@/components/interfaces/Reports/Reports.constants'
import type { ReportFilterItem } from '@/components/interfaces/Reports/Reports.types'
import { getLogsSql } from '@/components/interfaces/Reports/Reports.utils'
import { getDefaultHelper } from '@/components/interfaces/Settings/Logs/Logs.constants'
import type { LogData, LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import type { SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import { reportKeys, type ApiReportRequestParams } from '@/data/reports/keys'
import { IS_PLATFORM } from '@/lib/constants'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

const apiQueryNames = [
  'totalRequests',
  'topRoutes',
  'errorCounts',
  'topErrorRoutes',
  'responseSpeed',
  'topSlowRoutes',
  'networkTraffic',
  'requestsByCountry',
] as const

const fetchApiReportMetric = async ({
  projectRef,
  params,
  sql,
  useOtel,
  signal,
}: {
  projectRef: string | undefined
  params: ApiReportRequestParams
  sql: SafeLogSqlFragment
  useOtel: boolean
  signal: AbortSignal
}): Promise<LogData[]> => {
  if (projectRef === undefined) throw new Error('projectRef is required')

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(useOtel),
    sql,
    iso_timestamp_start: params.iso_timestamp_start,
    iso_timestamp_end: params.iso_timestamp_end,
    method: 'get',
    signal,
  })

  if (data?.error !== undefined) {
    const message = typeof data.error === 'string' ? data.error : data.error.message
    throw new Error(message)
  }
  return (data?.result ?? []) as LogData[]
}

export const useApiReport = () => {
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const flagUseOtel = useFlag('otelReports')
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const [requestParams, setRequestParams] = useState<ApiReportRequestParams>(() => {
    const defaultDateRange = getDefaultHelper(REPORTS_DATEPICKER_HELPERS)
    return {
      iso_timestamp_start: defaultDateRange.calcFrom(),
      iso_timestamp_end: defaultDateRange.calcTo(),
    }
  })

  const identifier = state.selectedDatabaseId
  const useOtel = IS_PLATFORM && Boolean(flagUseOtel)
  const resolvedProjectRef = IS_PLATFORM ? projectRef : (projectRef ?? 'default')
  const areQueriesReady =
    (!IS_PLATFORM || hasLoadedFlags === true) && resolvedProjectRef !== undefined
  const formattedFilters: ReportFilterItem[] = [
    ...filters,
    ...(identifier !== undefined
      ? [{ key: 'identifier', value: identifier, compare: 'is' } as ReportFilterItem]
      : []),
  ]
  const sql = {
    totalRequests: getLogsSql(PRESET_CONFIG.api.queries.totalRequests, formattedFilters, useOtel),
    topRoutes: getLogsSql(PRESET_CONFIG.api.queries.topRoutes, formattedFilters, useOtel),
    errorCounts: getLogsSql(PRESET_CONFIG.api.queries.errorCounts, formattedFilters, useOtel),
    topErrorRoutes: getLogsSql(PRESET_CONFIG.api.queries.topErrorRoutes, formattedFilters, useOtel),
    responseSpeed: getLogsSql(PRESET_CONFIG.api.queries.responseSpeed, formattedFilters, useOtel),
    topSlowRoutes: getLogsSql(PRESET_CONFIG.api.queries.topSlowRoutes, formattedFilters, useOtel),
    networkTraffic: getLogsSql(PRESET_CONFIG.api.queries.networkTraffic, formattedFilters, useOtel),
    requestsByCountry: getLogsSql(
      PRESET_CONFIG.api.queries.requestsByCountry,
      formattedFilters,
      useOtel
    ),
  }

  const activeQueries = useQueries({
    queries: apiQueryNames.map((queryName) => ({
      queryKey: reportKeys.apiMetric(
        resolvedProjectRef,
        queryName,
        requestParams,
        sql[queryName],
        useOtel
      ),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchApiReportMetric({
          projectRef: resolvedProjectRef,
          params: requestParams,
          sql: sql[queryName],
          useOtel,
          signal,
        }),
      enabled: areQueriesReady,
      refetchOnWindowFocus: false,
    })),
  })
  const [
    totalRequests,
    topRoutes,
    errorCounts,
    topErrorRoutes,
    responseSpeed,
    topSlowRoutes,
    networkTraffic,
    requestsByCountry,
  ] = activeQueries

  const addFilter = (filter: ReportFilterItem) => {
    if (filters.some((item) => isEqual(item, filter))) return
    setFilters((previousFilters) =>
      [...previousFilters, filter].sort((first, second) =>
        first.key.toLowerCase().localeCompare(second.key.toLowerCase())
      )
    )
  }
  const removeFilter = (filter: ReportFilterItem) => removeFilters([filter])
  const removeFilters = (filtersToRemove: ReportFilterItem[]) => {
    setFilters((previousFilters) =>
      previousFilters.filter((filter) => !filtersToRemove.some((item) => isEqual(filter, item)))
    )
  }
  const handleRefresh = async () => {
    if (!areQueriesReady) return
    await Promise.all(activeQueries.map((query) => query.refetch()))
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    setRequestParams((previousParams) => ({
      iso_timestamp_start: params.iso_timestamp_start ?? previousParams.iso_timestamp_start,
      iso_timestamp_end: params.iso_timestamp_end ?? previousParams.iso_timestamp_end,
    }))
  }

  const isLoading =
    !areQueriesReady || activeQueries.some((query) => query.isPending || query.isRefetching)

  return {
    data: {
      totalRequests: totalRequests.data ?? [],
      errorCounts: errorCounts.data ?? [],
      responseSpeed: responseSpeed.data ?? [],
      topRoutes: topRoutes.data ?? [],
      topErrorRoutes: topErrorRoutes.data ?? [],
      topSlowRoutes: topSlowRoutes.data ?? [],
      networkTraffic: networkTraffic.data ?? [],
      requestsByCountry: requestsByCountry.data ?? [],
    },
    params: {
      totalRequests: { ...requestParams, sql: sql.totalRequests },
      errorCounts: { ...requestParams, sql: sql.errorCounts },
      responseSpeed: { ...requestParams, sql: sql.responseSpeed },
      topRoutes: { ...requestParams, sql: sql.topRoutes },
      topErrorRoutes: { ...requestParams, sql: sql.topErrorRoutes },
      topSlowRoutes: { ...requestParams, sql: sql.topSlowRoutes },
      networkTraffic: { ...requestParams, sql: sql.networkTraffic },
      requestsByCountry: { ...requestParams, sql: sql.requestsByCountry },
    },
    error: {
      totalRequest: totalRequests.error?.message ?? null,
      errorCounts: errorCounts.error?.message ?? null,
      responseSpeed: responseSpeed.error?.message ?? null,
      topRoutes: topRoutes.error?.message ?? null,
      topErrorRoute: topErrorRoutes.error?.message ?? null,
      topSlowRoutes: topSlowRoutes.error?.message ?? null,
      networkTraffic: networkTraffic.error?.message ?? null,
      requestsByCountry: requestsByCountry.error?.message ?? null,
    },
    mergeParams: handleSetParams,
    filters,
    addFilter,
    removeFilter,
    removeFilters,
    isLoading,
    refresh: handleRefresh,
  }
}
