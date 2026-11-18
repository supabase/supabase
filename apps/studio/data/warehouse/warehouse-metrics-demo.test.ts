import { describe, expect, test } from 'vitest'

import type { WarehouseMetricName } from './warehouse-metrics-api-types'
import { createWarehouseMetricsDemo } from './warehouse-metrics-demo'

const variables = {
  projectRef: 'default',
  startDate: '2026-11-05T00:00:00.000Z',
  endDate: '2026-11-06T00:00:00.000Z',
  interval: '1m' as const,
}

const createWorkload = () => {
  const { metrics } = createWarehouseMetricsDemo({
    ...variables,
    attributes: [
      'activation_rate',
      'activation_duration_mean',
      'activation_duration_p95',
      'admission_rejection_rate',
      'assignment_wait_mean',
      'assignment_wait_p95',
      'query_rate',
      'query_in_flight',
      'query_duration_mean',
      'query_duration_p50',
      'query_duration_p95',
      'query_duration_p99',
      'query_error_rate',
      'query_timeout_rate',
      'query_canceled_rate',
      'worker_admission_active',
      'worker_admission_pending',
      'worker_admission_occupied',
      'worker_admission_limit',
    ],
  })
  return (name: WarehouseMetricName, labels: Record<string, string> = {}) => {
    const series = metrics
      .find(({ metric }) => metric === name)
      ?.series.find((series) =>
        Object.entries(labels).every(([key, value]) => series.labels[key] === value)
      )
    if (!series) throw new Error(`Missing series for ${name}`)
    return series.points.map(({ value }) => value!)
  }
}

describe('Warehouse demo workload realism', () => {
  test('keeps overlapping requests deterministic and independent of requested metrics', () => {
    const request = { ...variables, attributes: ['query_rate'] satisfies WarehouseMetricName[] }
    const full = createWarehouseMetricsDemo(request).metrics[0].series[0].points
    const partial = createWarehouseMetricsDemo({
      ...request,
      startDate: '2026-11-05T12:00:00.000Z',
      attributes: ['query_duration_mean', 'query_rate'],
    }).metrics[1].series[0].points
    expect(partial).toEqual(full.slice(720))
  })

  test('keeps starts and failures sparse, with timeouts included in query errors', () => {
    const values = createWorkload()
    for (const name of [
      'activation_rate',
      'query_error_rate',
      'query_timeout_rate',
      'query_canceled_rate',
      'admission_rejection_rate',
    ] satisfies WarehouseMetricName[]) {
      const rates = values(name)
      expect(rates.some((rate) => rate > 0)).toBe(true)
      expect(rates.filter((rate) => rate === 0).length).toBeGreaterThan(rates.length * 0.4)
      expect(Math.max(...rates)).toBeLessThan(0.02)
    }
    const errors = values('query_error_rate')
    values('query_timeout_rate').forEach((rate, index) => {
      expect(rate).toBeLessThanOrEqual(errors[index])
    })
    const cold = values('activation_rate', { kind: 'cold' })
    const warm = values('activation_rate', { kind: 'warm' })
    expect(cold.reduce((sum, rate) => sum + rate, 0)).toBeLessThan(
      warm.reduce((sum, rate) => sum + rate, 0)
    )
  })

  test('keeps durations, concurrency and capacity consistent during bursts', () => {
    const values = createWorkload()
    const active = values('worker_admission_active')
    const pending = values('worker_admission_pending')
    const occupied = values('worker_admission_occupied')
    const limit = values('worker_admission_limit')
    const rate = values('query_rate')
    const duration = values('query_duration_mean')
    const inFlight = values('query_in_flight')
    const p50 = values('query_duration_p50')
    const p95 = values('query_duration_p95')
    const p99 = values('query_duration_p99')
    const coldMean = values('activation_duration_mean', { kind: 'cold' })
    const warmMean = values('activation_duration_mean', { kind: 'warm' })
    const coldP95 = values('activation_duration_p95', { kind: 'cold' })
    const warmP95 = values('activation_duration_p95', { kind: 'warm' })
    const waits = values('assignment_wait_p95', { result: 'ok' })
    const timeoutWaits = values('assignment_wait_mean', { result: 'timeout' })

    active.forEach((count, index) => {
      expect(occupied[index]).toBe(count + pending[index])
      expect(occupied[index]).toBeLessThanOrEqual(limit[index])
      expect(Math.abs(inFlight[index] - rate[index] * duration[index])).toBeLessThan(0.51)
      expect(p50[index]).toBeLessThan(p95[index])
      expect(p95[index]).toBeLessThan(p99[index])
      expect(warmMean[index]).toBeLessThan(coldMean[index])
      expect(warmMean[index]).toBeLessThan(warmP95[index])
      expect(coldMean[index]).toBeLessThan(coldP95[index])
      expect(timeoutWaits[index]).toBeGreaterThanOrEqual(30)
      expect(timeoutWaits[index]).toBeGreaterThan(waits[index])
    })
  })
})
