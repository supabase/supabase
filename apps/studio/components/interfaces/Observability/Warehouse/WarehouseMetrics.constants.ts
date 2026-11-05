import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

export type WarehouseChartFormat = 'ms' | '/s' | ''

export interface WarehouseChartSeriesDef {
  metric: WarehouseMetricName
  label: string
  /** Rendered as a reference line, not counted against the series cap. */
  isLimit?: boolean
}

export interface WarehouseChartDef {
  id: string
  title: string
  tooltip: string
  format: WarehouseChartFormat
  series: readonly WarehouseChartSeriesDef[]
  /** The metric whose latest value is highlighted above the chart. */
  primaryMetric: WarehouseMetricName
}

export interface WarehouseSectionDef {
  id: 'queries' | 'latency' | 'capacity' | 'workers'
  title: string
  description: string
  charts: readonly WarehouseChartDef[]
}

/** Most lines drawn per chart; the rest are dropped by peak value. */
export const WAREHOUSE_METRICS_MAX_SERIES = 8
/** The API only serves the last 30 days. */
export const WAREHOUSE_METRICS_MAX_RANGE_DAYS = 30

export const WAREHOUSE_METRICS_SECTIONS: readonly WarehouseSectionDef[] = [
  {
    id: 'queries',
    title: 'Queries',
    description: 'How much work you send to Supabase Warehouse, and how much of it fails.',
    charts: [
      {
        id: 'query-rate',
        title: 'Query rate',
        tooltip:
          'Work started per second, including metadata lookups. Not a count of SQL statements.',
        format: '/s',
        primaryMetric: 'query_rate',
        series: [{ metric: 'query_rate', label: 'Queries' }],
      },
      {
        id: 'queries-in-progress',
        title: 'Queries in progress',
        tooltip: 'Queries running at the same time. Rising values mean concurrency is increasing.',
        format: '',
        primaryMetric: 'query_in_flight',
        series: [{ metric: 'query_in_flight', label: 'In progress' }],
      },
      {
        id: 'failed-queries',
        title: 'Failed queries',
        tooltip:
          "Failures per second. Timeouts are already included in errors, so don't add the lines together. Canceled queries are counted separately.",
        format: '/s',
        primaryMetric: 'query_error_rate',
        series: [
          { metric: 'query_error_rate', label: 'Errors' },
          { metric: 'query_timeout_rate', label: 'Timeouts (included in errors)' },
          { metric: 'query_canceled_rate', label: 'Canceled' },
        ],
      },
    ],
  },
  {
    id: 'latency',
    title: 'Latency',
    description: 'How long queries take, and how long they wait for a worker.',
    charts: [
      {
        id: 'query-duration',
        title: 'Query duration',
        tooltip: 'Time from when a query starts until it succeeds, fails, or is canceled.',
        format: 'ms',
        primaryMetric: 'query_duration_p95',
        series: [
          { metric: 'query_duration_mean', label: 'Average' },
          { metric: 'query_duration_p50', label: 'p50' },
          { metric: 'query_duration_p95', label: 'p95' },
          { metric: 'query_duration_p99', label: 'p99' },
        ],
      },
      {
        id: 'worker-wait',
        title: 'Time waiting for a worker',
        tooltip: 'How long queries wait for a worker to become available before they can run.',
        format: 'ms',
        primaryMetric: 'assignment_wait_p95',
        series: [
          { metric: 'assignment_wait_mean', label: 'Average' },
          { metric: 'assignment_wait_p95', label: 'p95' },
        ],
      },
      {
        id: 'execution-time',
        title: 'Execution time',
        tooltip:
          'Average time spent running successful queries, including streaming results back to the client.',
        format: 'ms',
        primaryMetric: 'duckdb_duration_mean',
        series: [{ metric: 'duckdb_duration_mean', label: 'Average' }],
      },
    ],
  },
  {
    id: 'capacity',
    title: 'Capacity',
    description: 'How many worker slots you use, and whether requests are turned away.',
    charts: [
      {
        id: 'worker-slots',
        title: 'Worker slots',
        tooltip:
          'Worker slots available to your Warehouse and how many are in use. Slots in use include running queries and those waiting to connect.',
        format: '',
        primaryMetric: 'worker_admission_occupied',
        series: [
          { metric: 'worker_admission_limit', label: 'Limit', isLimit: true },
          { metric: 'worker_admission_occupied', label: 'In use' },
          { metric: 'worker_admission_active', label: 'Running' },
          { metric: 'worker_admission_pending', label: 'Waiting to connect' },
        ],
      },
      {
        id: 'rejected-requests',
        title: 'Rejected requests',
        tooltip: 'Requests per second turned away before they could run, split by reason.',
        format: '/s',
        primaryMetric: 'admission_rejection_rate',
        series: [{ metric: 'admission_rejection_rate', label: 'Rejected' }],
      },
    ],
  },
  {
    id: 'workers',
    title: 'Workers and requests',
    description: 'How often workers start, and how requests to Supabase Warehouse perform.',
    charts: [
      {
        id: 'worker-starts',
        title: 'Worker starts',
        tooltip: 'Workers started per second, split by kind and result.',
        format: '/s',
        primaryMetric: 'activation_rate',
        series: [{ metric: 'activation_rate', label: 'Starts' }],
      },
      {
        id: 'worker-start-time',
        title: 'Worker start time',
        tooltip: 'How long it takes a worker to start, split by kind and result.',
        format: 'ms',
        primaryMetric: 'activation_duration_p95',
        series: [
          { metric: 'activation_duration_mean', label: 'Average' },
          { metric: 'activation_duration_p95', label: 'p95' },
        ],
      },
      {
        id: 'requests-by-method',
        title: 'Requests by method',
        tooltip: 'Requests per second, split by method and status. Not a count of SQL statements.',
        format: '/s',
        primaryMetric: 'rpc_rate',
        series: [{ metric: 'rpc_rate', label: 'Requests' }],
      },
      {
        id: 'request-duration',
        title: 'Request duration',
        tooltip: 'How long requests take to complete, split by method and status.',
        format: 'ms',
        primaryMetric: 'rpc_duration_p95',
        series: [
          { metric: 'rpc_duration_mean', label: 'Average' },
          { metric: 'rpc_duration_p95', label: 'p95' },
        ],
      },
    ],
  },
]

/** Distinct metric names used by a section, in declaration order. */
export const getSectionAttributes = (section: WarehouseSectionDef): WarehouseMetricName[] => {
  const names = section.charts.flatMap((chart) => chart.series.map((series) => series.metric))
  return [...new Set(names)]
}
