import { fireEvent, screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { WarehouseObservabilitySection } from './WarehouseObservabilitySection'
import { WAREHOUSE_SUMMARY_ATTRIBUTES } from './WarehouseObservabilitySection.utils'
import { createWarehouseMetric } from '@/components/interfaces/Observability/Warehouse/WarehouseMetrics.fixtures'
import type {
  WarehouseMetric,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const values: Partial<Record<WarehouseMetricName, number>> = {
  query_rate: 4,
  query_duration_p95: 0.8,
  query_error_rate: 0,
  worker_admission_occupied: 3,
  worker_admission_limit: 10,
}
const response = (overrides: Partial<WarehouseMetric> = {}): WarehouseMetricsResponse => ({
  metrics: WAREHOUSE_SUMMARY_ATTRIBUTES.map((name) =>
    createWarehouseMetric(name, {
      series: [
        {
          labels: {},
          points: [{ timestamp: 1762000000, value: values[name] ?? null }],
          coverage: { expected_points: 1, returned_points: 1 },
        },
      ],
      ...overrides,
    })
  ),
})
const mockMetrics = (body: WarehouseMetricsResponse) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<WarehouseMetricsResponse>(body),
  })

describe('Warehouse workload summary', () => {
  test('shows chart silhouettes before setup without measurements or controls', () => {
    customRender(<WarehouseObservabilitySection mode="example" />)
    expect(screen.queryByText('Example data')).not.toBeInTheDocument()
    expect(screen.getByText('Query performance appears after setup.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Query duration' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/Interval ending| ms|\/s/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Query rate' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View metrics' })).not.toBeInTheDocument()
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument()
  })

  test('never replaces unavailable project metrics with examples or a setup claim', async () => {
    mockMetrics(response({ availability: 'not_provisioned', series: [] }))
    customRender(<WarehouseObservabilitySection />)
    expect(
      await screen.findByText(
        'Warehouse metrics are unavailable. Replication status is shown above.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Example data')).not.toBeInTheDocument()
    expect(screen.queryByText('Warehouse is not enabled')).not.toBeInTheDocument()
  })

  test('keeps the workload section and metrics link available while observations load', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: () => new Promise<never>(() => {}),
    })

    customRender(<WarehouseObservabilitySection />)

    expect(await screen.findByText('Loading workload metrics...')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Workload' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View metrics' })).toHaveAttribute(
      'href',
      '/project/default/observability/warehouse'
    )
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument()
  })

  test('shows observed workload, latency, errors and capacity with the metrics link', async () => {
    mockMetrics(response())
    customRender(<WarehouseObservabilitySection />)
    expect(await screen.findByText('4/s')).toBeInTheDocument()
    expect(screen.getByText('800 ms')).toBeInTheDocument()
    expect(screen.getByText('0/s')).toBeInTheDocument()
    expect(screen.getByText('3 / 10')).toBeInTheDocument()
    expect(screen.getAllByText(/^Interval ending /)).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'View metrics' })).toHaveAttribute(
      'href',
      '/project/default/observability/warehouse'
    )
  })

  test('preserves low error rates rather than rounding them to zero', async () => {
    const body = response()
    const errors = body.metrics.find((metric) => metric.metric === 'query_error_rate')
    if (!errors) throw new Error('Query error fixture is missing')
    errors.series[0].points[0].value = 0.0033
    mockMetrics(body)
    customRender(<WarehouseObservabilitySection />)
    expect(await screen.findByText('0.0033/s')).toBeInTheDocument()
  })

  test('distinguishes missing telemetry from observed zero traffic', async () => {
    mockMetrics(response({ availability: 'no_data', series: [] }))
    customRender(<WarehouseObservabilitySection />)
    expect(await screen.findAllByText('No samples in this period')).toHaveLength(4)
    expect(screen.getAllByText('Unavailable')).toHaveLength(4)
    expect(screen.queryByText('0/s')).not.toBeInTheDocument()
  })

  test('discloses partial coverage beside available values', async () => {
    mockMetrics(response({ availability: 'partial' }))
    customRender(<WarehouseObservabilitySection />)
    expect(await screen.findAllByText('Partial data')).toHaveLength(4)
    expect(screen.getByText('800 ms')).toBeInTheDocument()
  })

  test('does not pair capacity observations from different intervals', async () => {
    const body = response()
    const limit = body.metrics.find((metric) => metric.metric === 'worker_admission_limit')
    if (!limit) throw new Error('Capacity limit fixture is missing')
    limit.series[0].points[0].timestamp += 60
    mockMetrics(body)
    customRender(<WarehouseObservabilitySection />)
    expect(await screen.findByText('No value at the latest interval')).toBeInTheDocument()
    expect(screen.queryByText('3 / 10')).not.toBeInTheDocument()
  })

  test.each(['partial', 'stale'] as const)(
    'discloses %s capacity-limit telemetry',
    async (availability) => {
      const body = response()
      const limit = body.metrics.find((metric) => metric.metric === 'worker_admission_limit')
      if (!limit) throw new Error('Capacity limit fixture is missing')
      limit.availability = availability
      mockMetrics(body)
      customRender(<WarehouseObservabilitySection />)
      expect(
        await screen.findByText(availability === 'partial' ? 'Partial data' : 'No recent data')
      ).toBeInTheDocument()
      if (availability === 'partial') expect(screen.getByText('3 / 10')).toBeInTheDocument()
      else expect(screen.queryByText('3 / 10')).not.toBeInTheDocument()
    }
  )

  test('lets users retry a failed summary request', async () => {
    let attempts = 0
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: () => {
        attempts += 1
        if (attempts === 1)
          return HttpResponse.json<APIErrorBody>(
            { message: 'Metrics request failed' },
            { status: 500 }
          )
        return HttpResponse.json<WarehouseMetricsResponse>(response())
      },
    })
    customRender(<WarehouseObservabilitySection />)
    expect(await screen.findByText('Failed to load Warehouse metrics')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('800 ms')).toBeInTheDocument()
  })
})
