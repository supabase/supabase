import type {
  WarehouseMetric,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'

const FIXTURE_PROJECT_REF = 'default'
const FIXTURE_START = 1_762_000_000
const FIXTURE_STEP_SECONDS = 60
const FIXTURE_POINT_COUNT = 10

type MetricShape = {
  unit: WarehouseMetric['unit']
  aggregation: WarehouseMetric['aggregation']
  /** One entry per series; empty means a single unlabeled series. */
  labels: Record<string, string>[]
  /** Base value, in the metric's own unit (durations in seconds). */
  base: number
}

const NO_LABELS: Record<string, string>[] = []
const RPC_LABELS = [
  { method: 'DoGet', status: 'ok' },
  { method: 'DoAction', status: 'ok' },
]
const START_LABELS = [
  { kind: 'cold', result: 'ok' },
  { kind: 'warm', result: 'ok' },
]

const METRIC_SHAPES: Record<WarehouseMetricName, MetricShape> = {
  query_rate: { unit: 'per_second', aggregation: 'rate', labels: NO_LABELS, base: 4 },
  query_in_flight: { unit: 'queries', aggregation: 'sum', labels: NO_LABELS, base: 3 },
  query_error_rate: { unit: 'per_second', aggregation: 'rate', labels: NO_LABELS, base: 0.2 },
  query_timeout_rate: { unit: 'per_second', aggregation: 'rate', labels: NO_LABELS, base: 0.05 },
  query_canceled_rate: { unit: 'per_second', aggregation: 'rate', labels: NO_LABELS, base: 0.1 },
  query_duration_mean: { unit: 'seconds', aggregation: 'mean', labels: NO_LABELS, base: 0.25 },
  query_duration_p50: { unit: 'seconds', aggregation: 'p50', labels: NO_LABELS, base: 0.2 },
  query_duration_p95: { unit: 'seconds', aggregation: 'p95', labels: NO_LABELS, base: 0.8 },
  query_duration_p99: { unit: 'seconds', aggregation: 'p99', labels: NO_LABELS, base: 1.5 },
  assignment_wait_mean: {
    unit: 'seconds',
    aggregation: 'mean',
    labels: [{ result: 'ok' }, { result: 'timeout' }],
    base: 0.05,
  },
  assignment_wait_p95: {
    unit: 'seconds',
    aggregation: 'p95',
    labels: [{ result: 'ok' }, { result: 'timeout' }],
    base: 0.2,
  },
  duckdb_duration_mean: { unit: 'seconds', aggregation: 'mean', labels: NO_LABELS, base: 0.15 },
  worker_admission_limit: { unit: 'grants', aggregation: 'sum', labels: NO_LABELS, base: 10 },
  worker_admission_occupied: {
    unit: 'grants',
    aggregation: 'occupied',
    labels: NO_LABELS,
    base: 4,
  },
  worker_admission_active: { unit: 'grants', aggregation: 'sum', labels: NO_LABELS, base: 3 },
  worker_admission_pending: { unit: 'grants', aggregation: 'sum', labels: NO_LABELS, base: 1 },
  admission_rejection_rate: {
    unit: 'per_second',
    aggregation: 'rate',
    labels: [{ reason: 'capacity' }],
    base: 0.1,
  },
  activation_rate: { unit: 'per_second', aggregation: 'rate', labels: START_LABELS, base: 0.3 },
  activation_duration_mean: {
    unit: 'seconds',
    aggregation: 'mean',
    labels: START_LABELS,
    base: 2,
  },
  activation_duration_p95: { unit: 'seconds', aggregation: 'p95', labels: START_LABELS, base: 4 },
  rpc_rate: { unit: 'per_second', aggregation: 'rate', labels: RPC_LABELS, base: 6 },
  rpc_duration_mean: { unit: 'seconds', aggregation: 'mean', labels: RPC_LABELS, base: 0.05 },
  rpc_duration_p95: { unit: 'seconds', aggregation: 'p95', labels: RPC_LABELS, base: 0.3 },
}

const buildPoints = (base: number, seriesIndex: number) =>
  Array.from({ length: FIXTURE_POINT_COUNT }, (_, index) => ({
    timestamp: FIXTURE_START + index * FIXTURE_STEP_SECONDS,
    value: Number((base * (1 + seriesIndex * 0.5 + (index % 3) * 0.1)).toFixed(4)),
  }))

export const createWarehouseMetric = (
  metric: WarehouseMetricName,
  overrides: Partial<WarehouseMetric> = {}
): WarehouseMetric => {
  const shape = METRIC_SHAPES[metric]
  const end = FIXTURE_START + (FIXTURE_POINT_COUNT - 1) * FIXTURE_STEP_SECONDS
  const labelSets = shape.labels.length > 0 ? shape.labels : [{}]

  return {
    project_ref: FIXTURE_PROJECT_REF,
    metric,
    unit: shape.unit,
    aggregation: shape.aggregation,
    definition: `Fixture definition for ${metric}`,
    requested: { metric, start: FIXTURE_START, end, step: FIXTURE_STEP_SECONDS },
    effective: {
      start: FIXTURE_START,
      end,
      step: FIXTURE_STEP_SECONDS,
      rate_window_seconds: 300,
    },
    scrape_interval_seconds: 60,
    availability: 'ok',
    last_sample_at: end,
    series: labelSets.map((labels, index) => ({
      labels,
      points: buildPoints(shape.base, index),
      coverage: { returned_points: FIXTURE_POINT_COUNT, expected_points: FIXTURE_POINT_COUNT },
    })),
    ...overrides,
  }
}

/** Overrides apply to every returned metric. */
export const createWarehouseMetricsResponse = (
  attributes: readonly WarehouseMetricName[],
  overrides: Partial<WarehouseMetric> = {}
): WarehouseMetricsResponse => ({
  metrics: attributes.map((attribute) => createWarehouseMetric(attribute, overrides)),
})
