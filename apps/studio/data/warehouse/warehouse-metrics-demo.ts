import type { WarehouseMetricsResponse } from './warehouse-metrics-api-types'
import type { WarehouseMetricsVariables } from './warehouse-metrics-query'
import { WAREHOUSE_METRIC_SHAPES } from './warehouse-metrics-shapes'

const INTERVAL_SECONDS = { '1m': 60, '5m': 300, '10m': 600, '30m': 1800, '1h': 3600, '1d': 86400 }

const noise = (seed: number) => {
  const hash = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b)
  return ((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff
}

const trend = (minute: number, width: number, seed: number) => {
  const position = minute / width
  const bucket = Math.floor(position)
  const fraction = position - bucket
  return noise(bucket + seed) * (1 - fraction) + noise(bucket + seed + 1) * fraction
}

const workloadAt = (timestamp: number) => {
  const minute = timestamp / 60
  const variation = noise(Math.floor(minute))
  const demand = trend(minute, 17, 109) * 0.8 + trend(minute, 53, 251) * 0.7
  const burst = Math.max(0, trend(minute, 7, 401) - 0.6) * 5
  const load = 0.35 + demand + burst
  const pressure = Math.max(0, load - 1.5)
  const queryRate = 1.2 + load * 3 + variation * 0.6
  const queryDuration = 0.18 + load * 0.16 + pressure * 1.8
  const active = Math.min(14, Math.ceil(3 + load * 4))
  const pending = Math.min(16 - active, Math.round(pressure * 5))
  const errors = variation > 0.94 ? (1 + Math.floor(pressure * 3)) / 300 : 0
  const timeouts = pressure > 0.3 && variation > 0.97 ? 1 / 300 : 0
  return { variation, load, pressure, queryRate, queryDuration, active, pending, errors, timeouts }
}

export const createWarehouseMetricsDemo = ({
  projectRef,
  attributes,
  startDate,
  endDate,
  interval,
}: WarehouseMetricsVariables): WarehouseMetricsResponse => {
  const start = Math.floor(Date.parse(startDate) / 1000)
  const end = Math.floor(Date.parse(endDate) / 1000)
  const step = Math.max(INTERVAL_SECONDS[interval], Math.ceil((end - start) / 1440 / 60) * 60)
  const count = Math.floor((end - start) / step) + 1

  return {
    metrics: attributes.map((metric) => {
      const shape = WAREHOUSE_METRIC_SHAPES[metric]
      const labelSets = shape.labels.length > 0 ? shape.labels : [{}]
      return {
        project_ref: projectRef ?? 'default',
        metric,
        unit: shape.unit,
        aggregation: shape.aggregation,
        definition: metric.replaceAll('_', ' '),
        requested: { metric, start, end, step: INTERVAL_SECONDS[interval] },
        effective: { start, end, step, rate_window_seconds: Math.max(300, step) },
        scrape_interval_seconds: 60,
        availability: 'ok',
        last_sample_at: start + (count - 1) * step,
        series: labelSets.map((labels) => ({
          labels,
          coverage: { returned_points: count, expected_points: count },
          points: Array.from({ length: count }, (_, index) => {
            const timestamp = start + index * step
            const workload = workloadAt(timestamp)
            const { variation, load, pressure, queryRate, queryDuration, active, pending } =
              workload
            let value = shape.base * (0.7 + load * 0.3)
            if (metric.startsWith('query_duration')) value = shape.base * (queryDuration / 0.25)
            if (metric === 'query_rate') value = queryRate
            if (metric === 'query_in_flight') value = Math.round(queryRate * queryDuration)
            if (metric === 'query_error_rate') value = workload.errors
            if (metric === 'query_timeout_rate') value = workload.timeouts
            if (metric === 'query_canceled_rate') value = variation < 0.04 ? 1 / 300 : 0
            if (metric === 'duckdb_duration_mean') value = queryDuration * 0.65
            if (metric === 'worker_admission_limit') value = 16
            if (metric === 'worker_admission_active') value = active
            if (metric === 'worker_admission_pending') value = pending
            if (metric === 'worker_admission_occupied') value = active + pending
            if (metric === 'admission_rejection_rate') {
              value = pending > 0 && variation > 0.95 ? 1 / 300 : 0
            }
            if (metric.startsWith('assignment_wait')) {
              value = shape.base * (0.2 + pressure * 12 + variation * 0.1)
              if (labels.result === 'timeout') value = 30
            }
            if (metric === 'activation_rate') {
              const starts = noise(Math.floor(timestamp / 300) + 577)
              value = starts > 0.5 ? (1 + Math.floor(pressure * 3)) / 300 : 0
              if (labels.kind === 'cold') value = starts > 0.94 ? 1 / 300 : 0
            }
            if (metric.startsWith('activation_duration')) {
              value = shape.base * (0.9 + variation * 0.3 + pressure * 0.5)
              if (labels.kind === 'warm') value *= 0.08
            }
            if (metric === 'rpc_rate') value = queryRate * 1.1
            if (metric.startsWith('rpc_duration')) value = shape.base * (0.7 + load * 0.4)
            if (labels.method === 'DoAction') value *= 0.18
            return { timestamp, value: Number(value.toFixed(4)) }
          }),
        })),
      }
    }),
  }
}
