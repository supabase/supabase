import dayjs from 'dayjs'

import { ReportConfig } from './reports.types'
import {
  extractStatusCodesFromData,
  generateStatusCodeAttributes,
  transformStatusCodeData,
} from '@/components/interfaces/Reports/Reports.utils'
import { NumericFilter } from '@/components/interfaces/Reports/v2/ReportsNumericFilter'
import { SelectFilters } from '@/components/interfaces/Reports/v2/ReportsSelectFilter'
import {
  isUnixMicro,
  unixMicroToIsoTimestamp,
} from '@/components/interfaces/Settings/Logs/Logs.utils'
import type { AnalyticsInterval } from '@/data/analytics/constants'
import {
  analyticsLiteral,
  joinSqlFragments,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'
import {
  analyticsIntervalToGranularity,
  fetchLogs,
  SAFE_COMPARISON_OPERATOR_SQL,
  SAFE_GRANULARITY_SQL,
} from '@/data/reports/report.utils'

type EdgeFunctionReportFilters = {
  status_code: NumericFilter | null
  region: SelectFilters
  execution_time: NumericFilter | null
  functions: SelectFilters
}

export function filterToWhereClause(filters?: EdgeFunctionReportFilters): SafeLogSqlFragment {
  const whereClauses: SafeLogSqlFragment[] = []

  if (filters?.functions && filters.functions.length > 0) {
    const ids = joinSqlFragments(filters.functions.map(analyticsLiteral), ',')
    whereClauses.push(safeSql`function_id IN (${ids})`)
  }

  if (filters?.status_code) {
    const op = SAFE_COMPARISON_OPERATOR_SQL[filters.status_code.operator]
    whereClauses.push(
      safeSql`response.status_code ${op} ${analyticsLiteral(filters.status_code.value)}`
    )
  }

  if (filters?.region && filters.region.length > 0) {
    const regions = joinSqlFragments(filters.region.map(analyticsLiteral), ',')
    whereClauses.push(safeSql`h.x_sb_edge_region IN (${regions})`)
  }

  if (filters?.execution_time) {
    const op = SAFE_COMPARISON_OPERATOR_SQL[filters.execution_time.operator]
    whereClauses.push(
      safeSql`m.execution_time_ms ${op} ${analyticsLiteral(filters.execution_time.value)}`
    )
  }

  if (whereClauses.length === 0) return safeSql``
  return safeSql`WHERE ${joinSqlFragments(whereClauses, ' AND ')}`
}

const METRIC_SQL: Record<
  string,
  (interval: AnalyticsInterval, filters?: EdgeFunctionReportFilters) => SafeLogSqlFragment
> = {
  TotalInvocations: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const whereClause = filterToWhereClause(filters)
    return safeSql`
--edgefn-report-invocations
select
  timestamp_trunc(timestamp, ${granularity}) as timestamp,
  function_id,
  count(*) as count
from
  function_edge_logs
  CROSS JOIN UNNEST(metadata) AS m
  CROSS JOIN UNNEST(m.request) AS request
  CROSS JOIN UNNEST(m.response) AS response
  CROSS JOIN UNNEST(response.headers) AS h
  ${whereClause}
group by
  timestamp,
  function_id
order by
  timestamp desc;
`
  },
  ExecutionStatusCodes: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const whereClause = filterToWhereClause(filters)
    return safeSql`
--edgefn-report-execution-status-codes
select
  timestamp_trunc(timestamp, ${granularity}) as timestamp,
  response.status_code as status_code,
  count(response.status_code) as count
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.response) as response
  cross join unnest(response.headers) as h
  ${whereClause}
group by
  timestamp,
  status_code
order by
  timestamp desc
`
  },
  InvocationsByRegion: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const whereClause = filterToWhereClause(filters)
    const regionCondition =
      whereClause.length > 0
        ? safeSql`AND h.x_sb_edge_region is not null`
        : safeSql`WHERE h.x_sb_edge_region is not null`

    return safeSql`
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
  ${whereClause}
  ${regionCondition}
group by
  timestamp,
  region
order by
  timestamp desc
`
  },
  ExecutionTime: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const whereClause = filterToWhereClause(filters)

    return safeSql`
--edgefn-report-execution-time
select
  timestamp_trunc(timestamp, ${granularity}) as timestamp,
  function_id,
  avg(m.execution_time_ms) as avg_execution_time
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
  cross join unnest(response.headers) as h
  ${whereClause}
group by
  timestamp,
  function_id
order by
  timestamp desc
`
  },
}

/**
 * Transforms raw invocation data by normalizing timestamps and adding function names
 * @param data - Raw data from the database
 * @param functions - Array of function objects with id and name
 * @returns Transformed data with normalized timestamps and function names
 */
export function transformInvocationData(data: any[], functions: { id: string; name: string }[]) {
  return data.map((log: any) => ({
    ...log,
    timestamp: isUnixMicro(log.timestamp)
      ? unixMicroToIsoTimestamp(log.timestamp)
      : dayjs.utc(log.timestamp).toISOString(),
    function_name: functions.find((f) => f.id === log.function_id)?.name ?? log.function_id,
  }))
}

/**
 * Aggregates invocation data by timestamp, summing counts for each timestamp
 * @param data - Transformed invocation data
 * @returns Aggregated data with one entry per timestamp
 */
export function aggregateInvocationsByTimestamp(data: any[]) {
  const aggregatedData = data.reduce((acc: Record<string, any>, item: any) => {
    const timestamp = item.timestamp
    if (!acc[timestamp]) {
      acc[timestamp] = { timestamp, count: 0 }
    }
    acc[timestamp].count += item.count
    return acc
  }, {})

  return Object.values(aggregatedData)
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
  filters: EdgeFunctionReportFilters
}): ReportConfig<EdgeFunctionReportFilters>[] => [
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
    dataProvider: async () => {
      const sql = METRIC_SQL.TotalInvocations(interval, filters)
      const response = await fetchLogs(projectRef, sql, startDate, endDate)

      if (!response?.result) return { data: [] }

      // Transform and aggregate the data using extracted functions
      const transformedData = transformInvocationData(response.result, functions)
      const data = aggregateInvocationsByTimestamp(transformedData)

      const attributes = [
        {
          attribute: 'count',
          label: 'Count',
        },
      ]

      return { data, attributes, query: sql }
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
    defaultChartStyle: 'line',
    titleTooltip: 'The total number of edge function executions by status code.',
    dataProvider: async () => {
      const sql = METRIC_SQL.ExecutionStatusCodes(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)

      if (!rawData?.result) return { data: [] }

      /**
       * The query returns { timestamp, status_code: 500, count: 10 }
       * and we have to transform it to { timestamp, 500: 10 }
       * to be able to render the chart.
       */

      const statusCodes = extractStatusCodesFromData(rawData.result)
      const attributes = generateStatusCodeAttributes(statusCodes)

      const data = transformStatusCodeData(rawData.result, statusCodes)

      return { data, attributes, query: sql }
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
    defaultChartStyle: 'line',
    titleTooltip: 'Average execution time for edge functions.',
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    format: (value: unknown) => `${Number(value).toFixed(0)}ms`,
    dataProvider: async () => {
      const sql = METRIC_SQL.ExecutionTime(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)

      if (!rawData?.result) return { data: [] }

      // Transform the raw data to ensure one data point per timestamp
      const transformedData = rawData.result?.map((point: any) => ({
        ...point,
        timestamp: isUnixMicro(point.timestamp)
          ? unixMicroToIsoTimestamp(point.timestamp)
          : dayjs.utc(point.timestamp).toISOString(),
        function_name: functions.find((f) => f.id === point.function_id)?.name ?? point.function_id,
      }))

      // If we have multiple function IDs, we need to aggregate the execution times per timestamp
      const aggregatedData = transformedData.reduce((acc: Record<string, any>, item: any) => {
        const timestamp = item.timestamp
        if (!acc[timestamp]) {
          acc[timestamp] = {
            timestamp,
            avg_execution_time: item.avg_execution_time,
            count: 1,
          }
        } else {
          // Calculate weighted average for multiple functions at the same timestamp
          const totalTime =
            acc[timestamp].avg_execution_time * acc[timestamp].count + item.avg_execution_time
          acc[timestamp].count += 1
          acc[timestamp].avg_execution_time = totalTime / acc[timestamp].count
        }
        return acc
      }, {})

      const data = Object.values(aggregatedData).map(({ count, ...item }) => item)

      const attributes = [
        {
          attribute: 'avg_execution_time',
          label: 'Avg. execution time (ms)',
        },
      ]
      return { data, attributes, query: sql }
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
    defaultChartStyle: 'line',
    titleTooltip: 'The total number of edge function invocations by region.',
    entitlement: 'edge_functions',
    requiredPlan: 'Pro',
    dataProvider: async () => {
      const sql = METRIC_SQL.InvocationsByRegion(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const data = rawData.result?.map((point: any) => ({
        ...point,
        timestamp: isUnixMicro(point.timestamp)
          ? unixMicroToIsoTimestamp(point.timestamp)
          : dayjs.utc(point.timestamp).toISOString(),
      }))

      const attributes = [
        {
          attribute: 'region',
          label: 'Region',
          provider: 'logs',
          enabled: true,
        },
        {
          attribute: 'count',
          label: 'Count',
          provider: 'logs',
          enabled: true,
        },
      ]

      return { data, attributes, query: sql }
    },
  },
]
