import { useQuery } from '@tanstack/react-query'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  EventChart,
  EventChartData,
  Filters,
  LogsEndpointParams,
} from 'components/interfaces/Settings/Logs/Logs.types'
import { genChartQuery } from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'data/fetchers'
import { useMemo } from 'react'

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
  const filterOverrideString = JSON.stringify(filterOverride)
  const mergedFilters = useMemo(
    () => ({
      ...filterOverride,
    }),
    [filterOverrideString]
  )

  const params: LogsEndpointParams = useMemo(() => {
    return { iso_timestamp_start: timestampStart, iso_timestamp_end: timestampEnd }
  }, [timestampStart, timestampEnd])

  const chartQuery = useMemo(
    () => genChartQuery(table, params, mergedFilters),
    [table, params, mergedFilters]
  )

  const chartQueryKey = useMemo(
    () => [
      'projects',
      projectRef,
      'logs-chart',
      table,
      {
        projectRef,
        sql: chartQuery,
        iso_timestamp_start: timestampStart,
        iso_timestamp_end: timestampEnd,
      },
    ],
    [projectRef, chartQuery, timestampStart, timestampEnd, table]
  )

  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery({
    queryKey: chartQueryKey,
    queryFn: async ({ signal }) => {
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
    refetchOnWindowFocus: false,
    enabled: typeof projectRef !== 'undefined',
  })

  const normalizedEventChartData = useTimeseriesUnixToIso(
    eventChartResponse?.result ?? [],
    'timestamp'
  )

  const { data: eventChartData, error: eventChartError } = useFillTimeseriesSorted({
    data: normalizedEventChartData,
    timestampKey: 'timestamp',
    valueKey: 'count',
    defaultValue: 0,
    startDate: timestampStart,
    endDate: timestampEnd ?? new Date().toISOString(),
  })

  return {
    isLoading: !eventChartResponse,
    error: eventChartError,
    filters: mergedFilters,
    params,
    eventChartData,
    refresh: refreshEventChart,
  }
}
export default useProjectUsageStats
