import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import {
  calculateAggregatedMetrics,
  calculateDateRange,
  calculateHealthMetrics,
  transformToBarChartData,
  type RawChartData,
} from './useServiceHealthMetrics.utils'
import { analyticsKeys } from '@/data/analytics/keys'
import {
  getServiceHealth,
  type ServiceHealthGranularity,
} from '@/data/analytics/service-health-query'
import { useFillTimeseriesSorted } from '@/hooks/analytics/useFillTimeseriesSorted'
import useTimeseriesUnixToIso from '@/hooks/analytics/useTimeseriesUnixToIso'

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

const SERVICE_LQL: Record<ServiceKey, string> = {
  db: 's:postgres_logs',
  auth: 's:auth_logs',
  functions: 's:function_edge_logs',
  storage: 's:storage_logs',
  realtime: 's:realtime_logs',
  postgrest: 's:postgrest_logs',
}

const INTERVAL_TO_GRANULARITY: Record<'1hr' | '1day' | '7day', ServiceHealthGranularity> = {
  '1hr': 'minute',
  '1day': 'hour',
  '7day': 'day',
}

/**
 * Hook to fetch health metrics for a single service using the service-health endpoint
 */
const useServiceHealthQuery = ({
  projectRef,
  serviceKey,
  startDate,
  endDate,
  granularity,
  enabled,
}: {
  projectRef: string
  serviceKey: ServiceKey
  startDate: string
  endDate: string
  granularity: ServiceHealthGranularity
  enabled: boolean
}) => {
  const lql = SERVICE_LQL[serviceKey]

  const queryResult = useQuery({
    queryKey: analyticsKeys.serviceHealth(projectRef, { startDate, endDate, granularity, lql }),
    queryFn: ({ signal }) =>
      getServiceHealth({ projectRef, startDate, endDate, granularity, lql }, signal),
    enabled: enabled && Boolean(projectRef),
    staleTime: 1000 * 60, // 1 minute
  })

  const rawRows = (queryResult.data?.result ?? []) as RawChartData[]

  // Convert unix microseconds to ISO timestamps (no-op if already ISO)
  const normalizedData = useTimeseriesUnixToIso(rawRows, 'timestamp')

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
 * Hook to fetch observability overview data for all services using the service-health endpoint
 */
export const useServiceHealthMetrics = (
  projectRef: string,
  interval: '1hr' | '1day' | '7day',
  refreshKey: number
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { startDate, endDate } = useMemo(() => calculateDateRange(interval), [interval, refreshKey])

  const granularity = INTERVAL_TO_GRANULARITY[interval]
  const enabled = Boolean(projectRef)

  const db = useServiceHealthQuery({
    projectRef,
    serviceKey: 'db',
    startDate,
    endDate,
    granularity,
    enabled,
  })
  const auth = useServiceHealthQuery({
    projectRef,
    serviceKey: 'auth',
    startDate,
    endDate,
    granularity,
    enabled,
  })
  const functions = useServiceHealthQuery({
    projectRef,
    serviceKey: 'functions',
    startDate,
    endDate,
    granularity,
    enabled,
  })
  const storage = useServiceHealthQuery({
    projectRef,
    serviceKey: 'storage',
    startDate,
    endDate,
    granularity,
    enabled,
  })
  const realtime = useServiceHealthQuery({
    projectRef,
    serviceKey: 'realtime',
    startDate,
    endDate,
    granularity,
    enabled,
  })
  const postgrest = useServiceHealthQuery({
    projectRef,
    serviceKey: 'postgrest',
    startDate,
    endDate,
    granularity,
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

  const aggregated = useMemo(() => calculateAggregatedMetrics(Object.values(services)), [services])

  const isLoading = Object.values(services).some((s) => s.isLoading)

  return {
    services,
    aggregated,
    isLoading,
    endDate,
  }
}
