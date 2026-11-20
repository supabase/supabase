import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'

import { WarehouseLatencySection } from './WarehouseLatencySection'
import { getWarehouseChartPoints } from './WarehouseMetricChart.utils'
import type {
  WarehouseMetric,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

beforeEach(() =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
)

const metric = (name: WarehouseMetric['metric']): WarehouseMetric => ({
  project_ref: 'default',
  metric: name,
  unit: 'seconds',
  aggregation: 'mean',
  definition: name,
  requested: { metric: name, start: 100, end: 160, step: 60 },
  effective: { start: 100, end: 160, step: 60, rate_window_seconds: 60 },
  scrape_interval_seconds: 60,
  last_sample_at: 160,
  availability: 'ok',
  series: [
    {
      labels: {},
      coverage: { returned_points: 2, expected_points: 2 },
      points: [
        { timestamp: 100, value: null },
        { timestamp: 160, value: 0.25 },
      ],
    },
  ],
})
const renderSection = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
) =>
  customRender(
    <WarehouseLatencySection
      range={{
        status: 'ok',
        startDate: '2026-11-18T00:00:00Z',
        endDate: '2026-11-18T01:00:00Z',
        interval: '1m',
        isClamped: false,
      }}
    />,
    { queryClient }
  )

test('shows latency charts and their timing boundaries', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      expect(new URL(request.url).searchParams.get('attributes')?.split(',')).toHaveLength(7)
      return HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [
          metric('query_duration_p95'),
          metric('assignment_wait_p95'),
          metric('duckdb_duration_mean'),
        ],
      })
    },
  })
  renderSection()
  expect(await screen.findByRole('region', { name: 'Query duration' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Query duration series' })).toHaveTextContent(
    'Averagep50p95p99'
  )
  expect(screen.getByText(/excluding SQL setup such as DuckLake connections/)).toBeInTheDocument()
  expect(screen.getByText(/including result streaming and client backpressure/)).toBeInTheDocument()
})
test('offers recovery when latency fails', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 }),
  })
  renderSection()
  expect(await screen.findByText('Failed to retrieve latency metrics')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
})
test('aligns percentiles preserving gaps and zeroes, and converts seconds to milliseconds', () => {
  const average = metric('query_duration_mean')
  const p95 = metric('query_duration_p95')
  p95.series[0].points = [
    { timestamp: 220, value: 0 },
    { timestamp: 160, value: 0.5 },
  ]
  expect(
    getWarehouseChartPoints(
      [
        { metric: average, label: 'Average' },
        { metric: p95, label: 'p95' },
      ],
      1000
    )
  ).toEqual([
    { timestamp: new Date(100000).toISOString() },
    { timestamp: new Date(160000).toISOString(), value0: 250, value1: 500 },
    { timestamp: new Date(220000).toISOString(), value1: 0 },
  ])
})

test('keeps latency charts available when refreshing fails', async () => {
  let shouldFail = false
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () =>
      shouldFail
        ? HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 })
        : HttpResponse.json<WarehouseMetricsResponse>({ metrics: [metric('query_duration_p95')] }),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  renderSection(queryClient)
  expect(await screen.findByRole('region', { name: 'Query duration' })).toBeInTheDocument()

  shouldFail = true
  await act(async () => {
    await queryClient.invalidateQueries()
  })
  await waitFor(() =>
    expect(screen.getByText('Failed to retrieve latency metrics')).toBeInTheDocument()
  )
  expect(screen.getByRole('region', { name: 'Query duration' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
})
