import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
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
  type ServiceHealthResultRow,
} from '@/data/analytics/service-health-query'
import { useFillTimeseriesSorted } from '@/hooks/analytics/useFillTimeseriesSorted'

dayjs.extend(utc)

export type ServiceKey =
  | 'db'
  | 'functions'
  | 'auth'
  | 'storage'
  | 'realtime'
  | 'data_api'
  | 'postgrest'

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

const INTERVAL_TO_GRANULARITY: Record<'1hr' | '1day' | '7day', ServiceHealthGranularity> = {
  '1hr': 'minute',
  '1day': 'hour',
  '7day': 'day',
}

/** Maps our service keys to the field names returned by the service-health endpoint */
const SERVICE_RESPONSE_KEY: Record<
  ServiceKey,
  Exclude<keyof ServiceHealthResultRow, 'timestamp'>
> = {
  db: 'postgres_logs',
  auth: 'auth_logs',
  functions: 'function_edge_logs',
  storage: 'storage_logs',
  realtime: 'realtime_logs',
  data_api: 'edge_logs',
  postgrest: 'postgrest_logs',
}

/** Extracts a single service's timeseries rows from the shared service-health response */
export function extractServiceRows(rows: ServiceHealthResultRow[], serviceKey: ServiceKey) {
  const responseKey = SERVICE_RESPONSE_KEY[serviceKey]
  return rows.map((row) => {
    const svc = row[responseKey]
    return {
      timestamp: row.timestamp,
      ok_count: svc?.ok ?? 0,
      warning_count: svc?.warning ?? 0,
      error_count: svc?.error ?? 0,
    }
  })
}

/**
 * Hook to fetch and process health metrics for a single service.
 * All service hooks share one deduplicated network request via the same query key.
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
  const queryResult = useQuery({
    queryKey: analyticsKeys.serviceHealth(projectRef, { startDate, endDate, granularity }),
    queryFn: ({ signal }) =>
      getServiceHealth({ projectRef, startDate, endDate, granularity }, signal),
    enabled: enabled && Boolean(projectRef),
    staleTime: 1000 * 60,
  })

  const rawRows = useMemo(
    () => extractServiceRows(queryResult.data?.result ?? [], serviceKey),
    [queryResult.data, serviceKey]
  )

  // Snap start/end to the granularity boundary so fillTimeseries iterates
  // in sync with the API's bucketed timestamps (e.g. midnight for 'day').
  const fillStart = dayjs.utc(startDate).startOf(granularity).toISOString()
  const fillEnd = dayjs.utc(endDate).startOf(granularity).toISOString()

  // Fill gaps in timeseries
  const { data: filledData } = useFillTimeseriesSorted({
    data: rawRows,
    timestampKey: 'timestamp',
    valueKey: ['ok_count', 'warning_count', 'error_count'],
    defaultValue: 0,
    startDate: fillStart,
    endDate: fillEnd,
  })

  const eventChartData: LogsBarChartDatum[] = useMemo(
    () => transformToBarChartData(filledData as RawChartData[]),
    [filledData]
  )

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
 * Hook to fetch observability overview data for all services using the service-health endpoint.
 * One network request is made; results are fanned out to each service by field name.
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

  const sharedParams = { projectRef, startDate, endDate, granularity, enabled }

  const db = useServiceHealthQuery({ ...sharedParams, serviceKey: 'db' })
  const auth = useServiceHealthQuery({ ...sharedParams, serviceKey: 'auth' })
  const functions = useServiceHealthQuery({ ...sharedParams, serviceKey: 'functions' })
  const storage = useServiceHealthQuery({ ...sharedParams, serviceKey: 'storage' })
  const realtime = useServiceHealthQuery({ ...sharedParams, serviceKey: 'realtime' })
  const data_api = useServiceHealthQuery({ ...sharedParams, serviceKey: 'data_api' })
  const postgrest = useServiceHealthQuery({ ...sharedParams, serviceKey: 'postgrest' })

  const services: Record<ServiceKey, ServiceHealthData> = useMemo(
    () => ({ db, auth, functions, storage, realtime, data_api, postgrest }),
    [db, auth, functions, storage, realtime, data_api, postgrest]
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
