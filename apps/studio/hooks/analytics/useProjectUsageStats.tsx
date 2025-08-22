import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  Count,
  EventChart,
  EventChartData,
  Filters,
  LogsEndpointParams,
} from 'components/interfaces/Settings/Logs/Logs.types'
import { genChartQuery, genCountQuery } from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'data/fetchers'
import { useFillTimeseriesSorted } from './useFillTimeseriesSorted'
import useTimeseriesUnixToIso from './useTimeseriesUnixToIso'

interface ProjectUsageStatsHookResult {
  error: string | Object | null
  isLoading: boolean
  filters: Filters
  params: LogsEndpointParams
  eventChartData: EventChartData[]
  refresh: () => void
}

function useProjectUsageStats({
  projectRef,
  table,
  timestampStart,
  timestampEnd,
  filterOverride,
}: {
  projectRef: string
  table: LogsTableName
  timestampStart: string
  timestampEnd: string
  filterOverride?: Filters
}): ProjectUsageStatsHookResult {
  const [latestRefresh, setLatestRefresh] = useState(new Date().toISOString())

  const mergedFilters = useMemo(
    () => ({
      ...filterOverride,
    }),
    [JSON.stringify(filterOverride)]
  )

  const params: LogsEndpointParams = useMemo(() => {
    return { iso_timestamp_start: timestampStart, iso_timestamp_end: timestampEnd }
  }, [timestampStart, timestampEnd])

  const countQuerySql = useMemo(() => genCountQuery(table, mergedFilters), [table, mergedFilters])
  const countQueryKey = useMemo(
    () => [
      'projects',
      projectRef,
      'logs-count',
      {
        projectRef,
        sql: countQuerySql,
        iso_timestamp_start: latestRefresh,
        iso_timestamp_end: timestampEnd,
        table,
        mergedFilters,
      },
    ],
    [projectRef, countQuerySql, latestRefresh, timestampEnd, table, mergedFilters]
  )

  const { data: countData } = useQuery(
    countQueryKey,
    async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            sql: countQuerySql,
            iso_timestamp_start: latestRefresh,
            iso_timestamp_end: timestampEnd,
          },
        },
        signal,
      })
      if (error) {
        throw error
      }

      return data as unknown as Count
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: 60000,
      enabled: true,
    }
  )

  const isCountReady = typeof countData !== 'undefined'

  const chartQuery = useMemo(
    () => genChartQuery(table, params, mergedFilters),
    [table, params, mergedFilters]
  )
  const chartQueryKey = useMemo(
    () => [
      'projects',
      projectRef,
      'logs-chart',
      {
        projectRef,
        sql: chartQuery,
        iso_timestamp_start: timestampStart,
        iso_timestamp_end: timestampEnd,
      },
    ],
    [projectRef, chartQuery, timestampStart, timestampEnd]
  )

  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery(
    chartQueryKey,
    async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            iso_timestamp_start: timestampStart,
            iso_timestamp_end: timestampEnd,
            sql: chartQuery,
          },
        },
        signal,
      })
      if (error) {
        throw error
      }

      return data as unknown as EventChart
    },
    { refetchOnWindowFocus: false, enabled: isCountReady }
  )

  const refresh = useCallback(async () => {
    setLatestRefresh(new Date().toISOString())
    refreshEventChart()
  }, [refreshEventChart])

  const normalizedEventChartData = useTimeseriesUnixToIso(
    eventChartResponse?.result ?? [],
    'timestamp'
  )

  const { data: eventChartData, error: eventChartError } = useFillTimeseriesSorted(
    normalizedEventChartData,
    'timestamp',
    'count',
    0,
    timestampStart,
    timestampEnd || new Date().toISOString()
  )

  return {
    isLoading: !isCountReady && !eventChartResponse,
    error: eventChartError,
    filters: mergedFilters,
    params,
    eventChartData,
    refresh,
  }
}
export default useProjectUsageStats
