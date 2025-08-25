import { get } from 'data/fetchers'
import type { AnalyticsInterval } from 'data/analytics/constants'
import {
  analyticsIntervalToGranularity,
  REPORT_STATUS_CODE_COLORS,
} from 'data/reports/report.utils'
import { getHttpStatusCodeInfo } from 'lib/http-status-codes'

export interface ReportFetchFunction {
  (
    projectRef: string,
    startDate: string,
    endDate: string,
    interval: AnalyticsInterval,
    functionIds?: string[],
    edgeFnIdToName?: (id: string) => string | undefined
  ): Promise<{ data: any }>
}
export interface Report {
  id: string
  label: string
  fetchFunction: ReportFetchFunction
  [key: string]: any
}

const METRIC_SQL: Record<string, (interval: AnalyticsInterval, functionIds?: string[]) => string> =
  {
    TotalInvocations: (interval, functionIds) => {
      return `
--edgefn-report-invocations
select
  timestamp_trunc(timestamp, ${analyticsIntervalToGranularity(interval)}) as timestamp,
  function_id,
  count(*) as count
from
  function_edge_logs
  CROSS JOIN UNNEST(metadata) AS m
  CROSS JOIN UNNEST(m.request) AS request
  CROSS JOIN UNNEST(m.response) AS response
  ${
    functionIds && functionIds.length > 0
      ? `WHERE function_id IN (${functionIds.map((id) => `'${id}'`).join(',')})`
      : ''
  }
group by
  timestamp,
  function_id
order by
  timestamp desc;
`
    },
    ExecutionStatusCodes: (interval, functionIds) => {
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
  ${
    functionIds && functionIds.length > 0
      ? `WHERE function_id IN (${functionIds.map((id) => `'${id}'`).join(',')})`
      : ''
  }
group by
  timestamp,
  status_code
order by
  timestamp desc;
`
    },
    InvocationsByRegion: (interval, functionIds) => {
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
  ${
    functionIds && functionIds.length > 0
      ? `and function_id IN (${functionIds.map((id) => `'${id}'`).join(',')})`
      : ''
  }
group by
  timestamp,
  region
order by
  timestamp desc
`
    },
    ExecutionTime: (interval, functionIds) => {
      const granularity = analyticsIntervalToGranularity(interval)
      const hasFunctions = functionIds && functionIds.length > 0
      return `
--edgefn-report-execution-time
select
  timestamp_trunc(timestamp, ${granularity}) as timestamp,
  ${hasFunctions ? 'function_id,' : ''}
  avg(m.execution_time_ms) as avg_execution_time
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  ${hasFunctions ? `where function_id IN (${functionIds.map((id) => `'${id}'`).join(',')})` : ''}
group by
  timestamp
  ${hasFunctions ? ', function_id' : ''}
order by
  timestamp desc
`
    },
  }

async function runQuery(projectRef: string, sql: string, startDate: string, endDate: string) {
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
}

export const edgeFunctionReports = ({
  projectRef,
  functions,
  startDate,
  endDate,
  interval,
  filters,
}: {
  projectRef: string
  functions: { id: string; name: string }[]
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  filters: {
    functionIds?: string[]
  }
}): Report[] => [
  {
    id: 'total-invocations',
    label: 'Total Edge Function Invocations',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'The total number of edge function invocations over time.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    fetchFunction: async () => {
      const sql = METRIC_SQL.TotalInvocations(interval, filters.functionIds)
      const response = await runQuery(projectRef, sql, startDate, endDate)

      if (!response?.result) return { data: [] }

      // Edge function logs do not include the function name,
      // so we have to map the function id to the function name
      // and add it to the returned data

      const data = response?.result?.map((log: any) => ({
        ...log,
        function_name: functions.find((f) => f.id === log.function_id)?.name ?? log.function_id,
      }))

      return { data }
    },
  },
  {
    id: 'execution-status-codes',
    label: 'Edge Function Status Codes',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of edge function executions by status code.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    fetchFunction: async () => {
      const sql = METRIC_SQL.ExecutionStatusCodes(interval, filters.functionIds)
      // const rawData = await runQuery(projectRef, sql, startDate, endDate)
      const rawData = {
        result: [
          {
            count: 20,
            status_code: 200,
            timestamp: 1756142640000000,
          },
        ],
        error: null,
      }
      if (!rawData) return { data: [], attributes: [] }
      const result = rawData.result || []

      const statusCodes = Array.from(new Set(result.map((p: any) => p.status_code)))

      const attributes = statusCodes.map((statusCode) => {
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
          attributes.forEach((attr) => {
            point[attr.attribute] = 0
          })
          const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
          matchingPoints.forEach((p: any) => {
            point[`status_${p.status_code}`] = p.count
          })
          return point
        })
      return { data, attributes }
    },
  },
  {
    id: 'execution-time',
    label: 'Edge Function Execution Time',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'Average execution time for edge functions.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    format: 'ms',
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    fetchFunction: async () => {
      const sql = METRIC_SQL.ExecutionTime(interval, filters.functionIds)
      // const rawData = await runQuery(projectRef, sql, startDate, endDate)
      const rawData = {
        result: [
          {
            avg_execution_time: 74.7,
            timestamp: 1756142640000000,
          },
        ],
        error: null,
      }
      if (!rawData) return { data: [], attributes: [] }
      const result = rawData.result || []
      const hasFunctions = functions.length > 0

      if (hasFunctions) {
        const attributes = functions.map((f) => ({
          attribute: f.id,
          label: f.name,
          provider: 'logs',
          enabled: true,
        }))

        if (result.length === 0) {
          return { data: [], attributes }
        }

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
              point[p.function_id as string] = p.avg_execution_time
            })
            return point
          })

        return { data, attributes }
      } else {
        const attributes = [
          {
            attribute: 'avg_execution_time',
            label: 'Avg. execution time (ms)',
            provider: 'logs',
            enabled: true,
          },
        ]

        const data = result
          .map((p: any) => ({
            period_start: p.timestamp,
            avg_execution_time: p.avg_execution_time,
          }))
          .sort(
            (a: { period_start: string }, b: { period_start: string }) =>
              new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
          )

        return { data, attributes }
      }
    },
  },
  {
    id: 'invocations-by-region',
    label: 'Edge Function Invocations by Region',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of edge function invocations by region.',
    availableIn: ['pro', 'team', 'enterprise'],
    fetchFunction: async () => {
      const sql = METRIC_SQL.InvocationsByRegion(interval, filters.functionIds)
      // const rawData = await runQuery(projectRef, sql, startDate, endDate)
      const rawData = {
        result: [
          {
            count: 20,
            region: 'eu-central-1',
            timestamp: 1756142640000000,
          },
        ],
        error: null,
      }
      if (!rawData) return { data: [], attributes: [] }
      const result = rawData.result || []

      const regions = Array.from(new Set(result.map((p: any) => p.region))).filter(Boolean)

      if (regions.length === 0) {
        return { data: [], attributes: [] }
      }

      const attributes = regions.map((region) => {
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
          attributes.forEach((attr) => {
            point[attr.attribute as string] = 0
          })
          const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
          matchingPoints.forEach((p: any) => {
            point[p.region] = p.count
          })
          return point
        })
      return { data, attributes }
    },
  },
]
