import { get } from 'data/fetchers'
import type { AnalyticsInterval } from 'data/analytics/constants'
import {
  analyticsIntervalToGranularity,
  REPORT_STATUS_CODE_COLORS,
} from 'data/reports/report.utils'
import { getHttpStatusCodeInfo } from 'lib/http-status-codes'

const MOCKED_RESPONSE = {
  result: [
    {
      count: 99,
      function_id: '123',
      timestamp: new Date('2025-08-20T00:00:00.000Z').getTime(),
      avg_execution_time: 24.7,
      '200': 33,
      '203': 10,
      '500': 66,
      region: 'eu-central-1',
    },
    {
      count: 30,
      function_id: '123',
      timestamp: new Date('2025-08-21T00:00:00.000Z').getTime(),
      avg_execution_time: 74.7,
      '200': 12,
      '203': 33,
      '500': 55,
      region: 'eu-central-1',
    },
    {
      count: 120,
      function_id: '123',
      timestamp: new Date('2025-08-22T00:00:00.000Z').getTime(),
      avg_execution_time: 66.7,
      '200': 33,
      '203': 44,
      '500': 22,
      region: 'eu-central-1',
    },
    {
      count: 120,
      function_id: '123',
      timestamp: new Date('2025-08-23T00:00:00.000Z').getTime(),
      avg_execution_time: 66.7,
      '200': 33,
      '203': 44,
      '500': 22,
      region: 'eu-central-1',
    },
    {
      count: 120,
      function_id: '123',
      timestamp: new Date('2025-08-24T00:00:00.000Z').getTime(),
      avg_execution_time: 66.7,
      '200': 33,
      '203': 44,
      '500': 22,
      region: 'eu-central-1',
    },
    {
      count: 230,
      function_id: '123',
      timestamp: new Date('2025-08-25T00:00:00.000Z').getTime(),
      avg_execution_time: 16.7,
      '200': 90,
      '203': 10,
      '500': 20,
      region: 'eu-central-1',
    },
    {
      count: 3509,
      function_id: '123',
      timestamp: new Date('2025-08-26T00:00:00.000Z').getTime(),
      avg_execution_time: 22.7,
      '200': 454,
      '203': 34,
      '500': 12,
      region: 'eu-central-1',
    },
    {
      count: 3000,
      function_id: '123',
      timestamp: new Date('2025-08-27T00:00:00.000Z').getTime(),
      avg_execution_time: 11.7,
      '200': 40,
      '203': 1,
      '500': 4,
      region: 'eu-central-1',
    },
  ],
}

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
  return MOCKED_RESPONSE
  // return data
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
    attributes: [
      {
        attribute: 'count',
        label: 'Count',
      },
    ],
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
    defaultChartStyle: 'line',
    titleTooltip: 'The total number of edge function executions by status code.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    attributes: [
      {
        attribute: '200',
        label: '200',
      },
      {
        attribute: '203',
        label: '203',
      },
      {
        attribute: '500',
        label: '500',
      },
    ],
    fetchFunction: async () => {
      const sql = METRIC_SQL.ExecutionStatusCodes(interval, filters.functionIds)
      const rawData = await runQuery(projectRef, sql, startDate, endDate)

      return { data: rawData.result }
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
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    format: 'ms',
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    attributes: [
      {
        attribute: 'avg_execution_time',
        label: 'Avg. execution time (ms)',
      },
    ],
    fetchFunction: async () => {
      const sql = METRIC_SQL.ExecutionTime(interval, filters.functionIds)
      const rawData = await runQuery(projectRef, sql, startDate, endDate)

      const data = rawData.result?.map((point: any) => ({
        ...point,
        function_name: functions.find((f) => f.id === point.function_id)?.name ?? point.function_id,
      }))

      return { data }
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
    availableIn: ['pro', 'team', 'enterprise'],
    attributes: [
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
    ],
    fetchFunction: async () => {
      const sql = METRIC_SQL.InvocationsByRegion(interval, filters.functionIds)
      const rawData = await runQuery(projectRef, sql, startDate, endDate)
      return { data: rawData.result }
    },
  },
]
