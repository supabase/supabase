import { useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import useTimeseriesUnixToIso from 'hooks/analytics/useTimeseriesUnixToIso'
import { useMemo } from 'react'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import { LogsTableName } from '../Settings/Logs/Logs.constants'
import { genChartQuery } from '../Settings/Logs/Logs.utils'
import {
  type RawChartData,
  calculateAggregatedMetrics,
  calculateDateRange,
  calculateHealthMetrics,
  transformToBarChartData,
} from './useServiceHealthMetrics.utils'

export type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime' | 'postgrest'

export type ServiceHealthData = {
  total: number
  errorRate: number
  successRate: number
  errorCount: number
  warningCount: number
  okCount: number
  eventChartData: LogsBarChartDatum[]
  isLoading: boolean
  error: unknown | null
  refresh: () => void
}

type ServiceConfig = {
  table: LogsTableName
  enabled: boolean
}

const SERVICE_CONFIG: Record<ServiceKey, ServiceConfig> = {
  db: { table: LogsTableName.POSTGRES, enabled: true },
  auth: { table: LogsTableName.AUTH, enabled: true },
  functions: { table: LogsTableName.FN_EDGE, enabled: true },
  storage: { table: LogsTableName.STORAGE, enabled: true },
  realtime: { table: LogsTableName.REALTIME, enabled: true },
  postgrest: { table: LogsTableName.POSTGREST, enabled: true },
}

type ChartQueryResult = {
  timestamp: string | number
  ok_count: number
  warning_count: number
  error_count: number
}

/**
 * Fetches service health metrics using the same logic as the logs pages
 */
const fetchServiceHealthMetrics = async (
  projectRef: string,
  table: LogsTableName,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<ChartQueryResult[]> => {
  const sql = genChartQuery(
    table,
    {
      iso_timestamp_start: startDate,
      iso_timestamp_end: endDate,
    },
    {}
  )

  const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: {
      path: { ref: projectRef },
      query: {
        sql,
        iso_timestamp_start: startDate,
        iso_timestamp_end: endDate,
      },
    },
    signal,
  })

  if (error ?? data?.error) {
    throw error ?? data?.error
  }

  return (data?.result ?? []) as ChartQueryResult[]
}

/**
 * Hook to fetch health metrics for a single service
 */
const useServiceHealthQuery = ({
  projectRef,
  serviceKey,
  startDate,
  endDate,
  enabled,
}: {
  projectRef: string
  serviceKey: ServiceKey
  startDate: string
  endDate: string
  enabled: boolean
}) => {
  const config = SERVICE_CONFIG[serviceKey]
  const table = config.table

  const queryResult = useQuery({
    queryKey: ['service-health-metrics', projectRef, serviceKey, startDate, endDate, table],
    queryFn: ({ signal }) =>
      fetchServiceHealthMetrics(projectRef, table, startDate, endDate, signal),
    enabled: enabled && config.enabled && Boolean(projectRef),
    staleTime: 1000 * 60, // 1 minute
  })

  // Convert unix microseconds to ISO timestamps
  const normalizedData = useTimeseriesUnixToIso(queryResult.data ?? [], 'timestamp')

  // Fill gaps in timeseries
  const { data: filledData } = useFillTimeseriesSorted({
    data: normalizedData,
    timestampKey: 'timestamp',
    valueKey: 'ok_count',
    defaultValue: 0,
    startDate,
    endDate,
  })

  // Transform to LogsBarChartDatum format
  const eventChartData: LogsBarChartDatum[] = useMemo(
    () => transformToBarChartData(filledData as RawChartData[]),
    [filledData]
  )

  // Calculate metrics
  const metrics = useMemo(() => calculateHealthMetrics(eventChartData), [eventChartData])

  return {
    ...metrics,
    eventChartData,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refresh: queryResult.refetch,
  }
}

/**
 * Hook to fetch observability overview data for all services using logs page queries
 */
export const useServiceHealthMetrics = (
  projectRef: string,
  interval: '1hr' | '1day' | '7day',
  refreshKey: number
) => {
  // Calculate date range based on interval
  // refreshKey is intentionally included to force recalculation when user refreshes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { startDate, endDate } = useMemo(() => calculateDateRange(interval), [interval, refreshKey])

  const enabled = Boolean(projectRef)

  // Fetch metrics for each service
  const db = useServiceHealthQuery({ projectRef, serviceKey: 'db', startDate, endDate, enabled })
  const auth = useServiceHealthQuery({
    projectRef,
    serviceKey: 'auth',
    startDate,
    endDate,
    enabled,
  })
  const functions = useServiceHealthQuery({
    projectRef,
    serviceKey: 'functions',
    startDate,
    endDate,
    enabled,
  })
  const storage = useServiceHealthQuery({
    projectRef,
    serviceKey: 'storage',
    startDate,
    endDate,
    enabled,
  })
  const realtime = useServiceHealthQuery({
    projectRef,
    serviceKey: 'realtime',
    startDate,
    endDate,
    enabled,
  })
  const postgrest = useServiceHealthQuery({
    projectRef,
    serviceKey: 'postgrest',
    startDate,
    endDate,
    enabled,
  })

  const services: Record<ServiceKey, ServiceHealthData> = useMemo(
    () => ({
      db,
      auth,
      functions,
      storage,
      realtime,
      postgrest,
    }),
    [db, auth, functions, storage, realtime, postgrest]
  )

  // Calculate aggregated metrics
  const aggregated = useMemo(() => calculateAggregatedMetrics(Object.values(services)), [services])

  const isLoading = Object.values(services).some((s) => s.isLoading)

  return {
    services,
    aggregated,
    isLoading,
    endDate,
  }
}
