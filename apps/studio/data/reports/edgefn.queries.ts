import { useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { AnalyticsInterval } from 'data/analytics/constants'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { getHttpStatusCodeInfo } from 'lib/http-status-codes'
import { analyticsIntervalToGranularity } from './report.utils'
import { REPORT_STATUS_CODE_COLORS } from './report.utils'

/**
 * METRICS
 * Each chart in the UI has a corresponding metric key.
 */

const METRIC_KEYS = [
  'TotalInvocations',
  'ExecutionStatusCodes',
  'InvocationsByRegion',
  'ExecutionTime',
]

type MetricKey = (typeof METRIC_KEYS)[number]

/**
 * SQL
 * Each metric has a corresponding SQL query.
 */

const METRIC_SQL: Record<MetricKey, (interval: AnalyticsInterval, functionId?: string) => string> =
  {
    TotalInvocations: (interval, functionId) => {
      return `
--edgefn-report-invocations
select
  timestamp_trunc(timestamp, ${analyticsIntervalToGranularity(interval)}) as timestamp,
  request.pathname as function_path,
  count(*) as count
from
  function_edge_logs
  CROSS JOIN UNNEST(metadata) AS m
  CROSS JOIN UNNEST(m.request) AS request
  CROSS JOIN UNNEST(m.response) AS response
  ${functionId ? `WHERE function_id = '${functionId}'` : ''}
group by
  timestamp,
  function_path
order by
  timestamp desc;        

    `
    },
    ExecutionStatusCodes: (interval, functionId) => {
      return `
--edgefn-report-execution-status-codes
select
  timestamp_trunc(timestamp, ${analyticsIntervalToGranularity(interval)}) as timestamp,
  response.status_code AS status_code,
  COUNT(*) AS count
FROM
  function_edge_logs
  CROSS JOIN UNNEST(metadata) AS m
  CROSS JOIN UNNEST(m.response) AS response
  CROSS JOIN UNNEST(m.request) AS request
  ${functionId ? `WHERE function_id = '${functionId}'` : ''}
group by
  timestamp,
  status_code
order by
  timestamp desc;
    `
    },
    InvocationsByRegion: (interval, functionId) => {
      const granularity = analyticsIntervalToGranularity(interval)
      return `
--edgefn-report-invocations-by-region
select
  timestamp_trunc(timestamp, ${granularity}) as timestamp,
  h.x_sb_edge_region as region,
  count(*) as count
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.response) as r
  cross join unnest(r.headers) as h
  where h.x_sb_edge_region is not null
  ${functionId ? `and function_id = '${functionId}'` : ''}
group by
  timestamp,
  region
order by
  timestamp desc
    `
    },
    ExecutionTime: (interval, functionId) => {
      const granularity = analyticsIntervalToGranularity(interval)
      return `
--edgefn-report-execution-time
select
  timestamp_trunc(timestamp, ${granularity}) as timestamp,
  request.pathname as function_path,
  avg(m.execution_time_ms) as avg_execution_time
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  ${functionId ? `where function_id = '${functionId}'` : ''}
group by
  timestamp,
  function_path
order by
  timestamp desc
    `
    },
  }

/**
 * FORMATTERS.
 * Metrics need to be formatted before being passed on to the UI charts.
 */

function defaultFormatter(rawData: any, attributes: MultiAttribute[]) {
  const chartAttributes = attributes
  if (!rawData) return { data: undefined, chartAttributes }
  const result = rawData.result || []
  const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
  const data = Array.from(timestamps)
    .sort()
    .map((timestamp) => {
      const point: any = { period_start: timestamp }
      chartAttributes.forEach((attr) => {
        point[attr.attribute] = 0
      })
      const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
      matchingPoints.forEach((p: any) => {
        point[attributes[0].attribute] = p.count
      })
      return point
    })
  return { data, chartAttributes }
}

const METRIC_FORMATTER: Record<
  MetricKey,
  (
    rawData: any,
    attributes: MultiAttribute[],
    logsMetric: string,
    functionId?: string
  ) => { data: any; chartAttributes: any }
> = {
  TotalInvocations: (rawData, attributes, logsMetric, functionId) => {
    if (functionId) {
      // A single function is selected, use the default single-attribute behavior.
      return defaultFormatter(rawData, attributes)
    }

    // Multiple functions, create dynamic attributes
    if (!rawData) return { data: undefined, chartAttributes: attributes }
    const result = rawData.result || []

    const functionPaths = Array.from(new Set(result.map((p: any) => p.function_path))) as string[]

    if (functionPaths.length === 0) {
      return { data: [], chartAttributes: [] } // No data, empty chart
    }

    const chartAttributes = functionPaths.map((path: string) => ({
      attribute: path,
      label: path.startsWith('/') ? path.substring(1) : path,
      provider: 'logs',
      enabled: true,
    }))

    const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
        matchingPoints.forEach((p: any) => {
          point[p.function_path as string] = p.count
        })
        return point
      })

    return { data, chartAttributes }
  },
  ExecutionStatusCodes: (rawData, attributes) => {
    if (!rawData) return { data: undefined, chartAttributes: attributes }
    const result = rawData.result || []

    const statusCodes = Array.from(new Set(result.map((p: any) => p.status_code)))

    const chartAttributes = statusCodes.map((statusCode) => {
      const statusCodeInfo = getHttpStatusCodeInfo(Number(statusCode))
      const color =
        REPORT_STATUS_CODE_COLORS[String(statusCode)] || REPORT_STATUS_CODE_COLORS.default

      return {
        attribute: `status_${statusCode}`,
        label: `${statusCode} ${statusCodeInfo.label}`,
        provider: 'logs',
        enabled: true,
        color: color,
        statusCode: String(statusCode),
      }
    })

    const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
        matchingPoints.forEach((p: any) => {
          point[`status_${p.status_code}`] = p.count
        })
        return point
      })

    return { data, chartAttributes }
  },
  InvocationsByRegion: (rawData, attributes) => {
    if (!rawData) return { data: undefined, chartAttributes: attributes }
    const result = rawData.result || []

    const regions = Array.from(new Set(result.map((p: any) => p.region))).filter(Boolean)

    if (regions.length === 0) {
      return { data: [], chartAttributes: [] } // No data, empty chart
    }

    const chartAttributes = regions.map((region) => {
      return {
        attribute: region,
        label: region,
        provider: 'logs',
        enabled: true,
      }
    })

    const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
        matchingPoints.forEach((p: any) => {
          point[p.region] = p.count
        })
        return point
      })

    return { data, chartAttributes }
  },
  ExecutionTime: (rawData, attributes, logsMetric, functionId) => {
    if (functionId) {
      if (!rawData) return { data: undefined, chartAttributes: attributes }
      const result = rawData.result || []
      const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
      const data = Array.from(timestamps)
        .sort()
        .map((timestamp) => {
          const point: any = { period_start: timestamp }
          attributes.forEach((attr) => {
            point[attr.attribute] = 0
          })
          const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
          matchingPoints.forEach((p: any) => {
            point[attributes[0].attribute] = p.avg_execution_time
          })
          return point
        })
      return { data, chartAttributes: attributes }
    }
    // Multiple functions, create dynamic attributes
    if (!rawData) return { data: undefined, chartAttributes: attributes }
    const result = rawData.result || []

    const functionPaths = Array.from(new Set(result.map((p: any) => p.function_path))) as string[]

    if (functionPaths.length === 0) {
      return { data: [], chartAttributes: [] } // No data, empty chart
    }

    const chartAttributes = functionPaths.map((path: string) => ({
      attribute: path,
      label: path.startsWith('/') ? path.substring(1) : path,
      provider: 'logs',
      enabled: true,
    }))

    const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
        matchingPoints.forEach((p: any) => {
          point[p.function_path as string] = p.avg_execution_time
        })
        return point
      })

    return { data, chartAttributes }
  },
}

/**
 * REPORT QUERY.
 * Fetching and state management for the report.
 */

export function useEdgeFunctionReport({
  projectRef,
  attributes,
  startDate,
  endDate,
  interval,
  enabled = true,
  functionId,
}: {
  projectRef: string
  attributes: MultiAttribute[]
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  enabled?: boolean
  functionId?: string
}) {
  const logsMetric = attributes.length > 0 ? attributes[0].attribute : ''

  const isEdgeFnMetric = METRIC_KEYS.includes(logsMetric)

  const sql = isEdgeFnMetric ? METRIC_SQL[logsMetric as MetricKey](interval, functionId) : ''

  const {
    data: rawData,
    error,
    isLoading,
  } = useQuery(
    ['edge-function-report', projectRef, logsMetric, startDate, endDate, interval, sql, functionId],
    async () => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            sql,
            iso_timestamp_start: startDate,
            iso_timestamp_end: endDate,
          },
        },
      })
      if (error) throw error
      return data
    },
    {
      enabled: Boolean(projectRef && sql && enabled && isEdgeFnMetric),
      refetchOnWindowFocus: false,
    }
  )

  // Use formatter if available
  const formatter =
    (isEdgeFnMetric ? METRIC_FORMATTER[logsMetric as MetricKey] : undefined) || defaultFormatter
  const { data, chartAttributes } = formatter(rawData, attributes, logsMetric, functionId)

  return {
    data,
    attributes: chartAttributes,
    isLoading,
    error,
  }
}
