import type {
  WarehouseMetric,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { WAREHOUSE_METRIC_SHAPES } from '@/data/warehouse/warehouse-metrics-shapes'

const FIXTURE_PROJECT_REF = 'default'
const FIXTURE_START = 1_762_000_000
const FIXTURE_STEP_SECONDS = 60
const FIXTURE_POINT_COUNT = 10

const buildPoints = (base: number, seriesIndex: number) =>
  Array.from({ length: FIXTURE_POINT_COUNT }, (_, index) => ({
    timestamp: FIXTURE_START + index * FIXTURE_STEP_SECONDS,
    value: Number((base * (1 + seriesIndex * 0.5 + (index % 3) * 0.1)).toFixed(4)),
  }))

export const createWarehouseMetric = (
  metric: WarehouseMetricName,
  overrides: Partial<WarehouseMetric> = {}
): WarehouseMetric => {
  const shape = WAREHOUSE_METRIC_SHAPES[metric]
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
