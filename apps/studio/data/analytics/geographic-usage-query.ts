import { queryOptions, useQuery } from '@tanstack/react-query'
import { FeatureFlagContext, useFlag } from 'common'
import { useContext } from 'react'

import { geographicUsageKeys } from './geographic-usage-keys'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { analyticsLiteral, safeSql } from '@/data/logs/safe-analytics-sql'
import { IS_PLATFORM } from '@/lib/constants'

export type GeographicUsageRange = '24h' | '7d' | '30d'

export type GeographicUsageCountry = {
  code: string
  requests: number
  previousRequests: number
  change: number | null
}

export type GeographicUsage = {
  totalRequests: number
  locatedRequests: number
  coveragePercent: number
  eligibleCountryCount: number
  minimumRequests: number
  lastUpdated: string
  countries: GeographicUsageCountry[]
}

export type GeographicUsageTrendPoint = {
  timestamp: string
  requests: number
}

type GeographicUsageRow = {
  country: string | null
  requests: number | string
  previous_requests: number | string
}

type TotalRequestsRow = {
  requests: number | string
}

const MINIMUM_REQUESTS = 25
const RANGE_DURATION_MS: Record<GeographicUsageRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

export function getGeographicUsagePeriod(range: GeographicUsageRange, now = new Date()) {
  const duration = RANGE_DURATION_MS[range]
  const end = new Date(now)
  const start = new Date(end.getTime() - duration)
  const previousStart = new Date(start.getTime() - duration)

  return { previousStart, start, end }
}

export function normalizeGeographicUsage({
  rows,
  totalRequests,
  lastUpdated,
}: {
  rows: GeographicUsageRow[]
  totalRequests: number
  lastUpdated: string
}): GeographicUsage {
  const countries = rows
    .filter((row) => row.country !== null && Number(row.requests) >= MINIMUM_REQUESTS)
    .map((row) => {
      const requests = Number(row.requests)
      const previousRequests = Number(row.previous_requests)
      const change =
        previousRequests > 0 ? ((requests - previousRequests) / previousRequests) * 100 : null

      return {
        code: row.country as string,
        requests,
        previousRequests,
        change,
      }
    })
    .sort((a, b) => b.requests - a.requests)

  const locatedRequests = rows.reduce((sum, row) => sum + Number(row.requests), 0)

  return {
    totalRequests,
    locatedRequests,
    coveragePercent: totalRequests > 0 ? (locatedRequests / totalRequests) * 100 : 0,
    eligibleCountryCount: countries.length,
    minimumRequests: MINIMUM_REQUESTS,
    lastUpdated,
    countries,
  }
}

async function getGeographicUsage({
  projectRef,
  range,
  useOtel,
  signal,
}: {
  projectRef: string
  range: GeographicUsageRange
  useOtel: boolean
  signal?: AbortSignal
}) {
  const period = getGeographicUsagePeriod(range)
  const currentStart = analyticsLiteral(period.start.toISOString())
  const countrySql = useOtel
    ? safeSql`
    select
      log_attributes['request.cf.country'] as country,
      sum(if(timestamp >= ${currentStart}, 1, 0)) as requests,
      sum(if(timestamp < ${currentStart}, 1, 0)) as previous_requests
    from logs
    where source = 'edge_logs'
      and notEmpty(log_attributes['request.cf.country'])
      and timestamp >= ${analyticsLiteral(period.previousStart.toISOString())}
      and timestamp < ${analyticsLiteral(period.end.toISOString())}
    group by country
    order by requests desc
    limit 250
  `
    : safeSql`
    select
      cf.country as country,
      countif(t.timestamp >= ${currentStart}) as requests,
      countif(t.timestamp < ${currentStart}) as previous_requests
    from edge_logs t
      cross join unnest(metadata) as m
      cross join unnest(m.request) as request
      cross join unnest(request.cf) as cf
    where cf.country is not null
      and t.timestamp >= ${analyticsLiteral(period.previousStart.toISOString())}
      and t.timestamp < ${analyticsLiteral(period.end.toISOString())}
    group by cf.country
  `
  const totalSql = useOtel
    ? safeSql`
    select count() as requests
    from logs
    where source = 'edge_logs'
      and timestamp >= ${currentStart}
    limit 1
    `
    : safeSql`
    select count(t.id) as requests
    from edge_logs t
    where t.timestamp >= ${currentStart}
  `
  const request = {
    projectRef,
    endpoint: logsAllEndpointUrl(useOtel),
    iso_timestamp_start: period.previousStart.toISOString(),
    iso_timestamp_end: period.end.toISOString(),
    method: 'post' as const,
    signal,
  }
  const [countryResponse, totalResponse] = await Promise.all([
    executeAnalyticsSql({ ...request, sql: countrySql }),
    executeAnalyticsSql({ ...request, sql: totalSql }),
  ])
  const rows = (countryResponse?.result ?? []) as GeographicUsageRow[]
  const totals = (totalResponse?.result ?? []) as TotalRequestsRow[]

  return normalizeGeographicUsage({
    rows,
    totalRequests: Number(totals[0]?.requests ?? 0),
    lastUpdated: period.end.toISOString(),
  })
}

async function getGeographicUsageTrend({
  projectRef,
  countryCode,
  range,
  useOtel,
  signal,
}: {
  projectRef: string
  countryCode: string
  range: GeographicUsageRange
  useOtel: boolean
  signal?: AbortSignal
}) {
  const period = getGeographicUsagePeriod(range)
  const country = analyticsLiteral(countryCode)
  const bucket = range === '24h' ? 'hour' : 'day'
  const otelBucket =
    bucket === 'hour' ? safeSql`toStartOfHour(timestamp)` : safeSql`toStartOfDay(timestamp)`
  const bigQueryBucket = bucket === 'hour' ? safeSql`hour` : safeSql`day`
  const sql = useOtel
    ? safeSql`
        select
          ${otelBucket} as timestamp,
          count() as requests
        from logs
        where source = 'edge_logs'
          and log_attributes['request.cf.country'] = ${country}
        group by timestamp
        order by timestamp asc
        limit 1000
      `
    : safeSql`
        select
          timestamp_trunc(t.timestamp, ${bigQueryBucket}) as timestamp,
          count(t.id) as requests
        from edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.request) as request
          cross join unnest(request.cf) as cf
        where cf.country = ${country}
        group by timestamp
        order by timestamp asc
        limit 1000
      `
  const response = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(useOtel),
    sql,
    iso_timestamp_start: period.start.toISOString(),
    iso_timestamp_end: period.end.toISOString(),
    method: 'post',
    signal,
  })
  const rows = (response?.result ?? []) as {
    timestamp: string | number
    requests: number | string
  }[]

  return rows.map((row) => ({
    timestamp: String(row.timestamp),
    requests: Number(row.requests),
  }))
}

export function geographicUsageQueryOptions({
  projectRef,
  range,
  useOtel = false,
}: {
  projectRef?: string
  range: GeographicUsageRange
  useOtel?: boolean
}) {
  return queryOptions({
    queryKey: geographicUsageKeys.usage(projectRef, range, useOtel),
    queryFn: ({ signal }) => {
      if (!projectRef) throw new Error('projectRef is required')
      return getGeographicUsage({ projectRef, range, useOtel, signal })
    },
    enabled: IS_PLATFORM && projectRef !== undefined,
    staleTime: 15 * 60 * 1000,
  })
}

export function geographicUsageTrendQueryOptions({
  projectRef,
  countryCode,
  range,
  useOtel = false,
}: {
  projectRef?: string
  countryCode?: string
  range: GeographicUsageRange
  useOtel?: boolean
}) {
  return queryOptions({
    queryKey: geographicUsageKeys.trend(projectRef, countryCode, range, useOtel),
    queryFn: ({ signal }) => {
      if (!projectRef) throw new Error('projectRef is required')
      if (!countryCode) throw new Error('countryCode is required')
      return getGeographicUsageTrend({ projectRef, countryCode, range, useOtel, signal })
    },
    enabled: IS_PLATFORM && projectRef !== undefined && countryCode !== undefined,
    staleTime: 15 * 60 * 1000,
  })
}

export function useGeographicUsageQuery({
  projectRef,
  range,
}: {
  projectRef?: string
  range: GeographicUsageRange
}) {
  const useOtel = IS_PLATFORM && Boolean(useFlag('otelReports'))
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)

  return useQuery({
    ...geographicUsageQueryOptions({ projectRef, range, useOtel }),
    enabled: IS_PLATFORM && hasLoadedFlags === true && projectRef !== undefined,
  })
}

export function useGeographicUsageTrendQuery({
  projectRef,
  countryCode,
  range,
}: {
  projectRef?: string
  countryCode?: string
  range: GeographicUsageRange
}) {
  const useOtel = IS_PLATFORM && Boolean(useFlag('otelReports'))
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)

  return useQuery({
    ...geographicUsageTrendQueryOptions({ projectRef, countryCode, range, useOtel }),
    enabled:
      IS_PLATFORM &&
      hasLoadedFlags === true &&
      projectRef !== undefined &&
      countryCode !== undefined,
  })
}
