import { QueryClient } from '@tanstack/react-query'
import { screen, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'

import { WarehouseWorkersSection } from './WarehouseWorkersSection'
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
  unit: name.endsWith('_rate') ? 'per_second' : 'seconds',
  aggregation: 'mean',
  definition: name,
  requested: { metric: name, start: 100, end: 160, step: 60 },
  effective: { start: 100, end: 160, step: 60, rate_window_seconds: 60 },
  scrape_interval_seconds: 60,
  last_sample_at: 160,
  availability: 'ok',
  series: [
    {
      labels: name.startsWith('activation_')
        ? { kind: 'warm', result: 'success' }
        : { method: 'query', status: 'ok' },
      coverage: { returned_points: 2, expected_points: 2 },
      points: [
        { timestamp: 100, value: null },
        { timestamp: 160, value: 0.25 },
      ],
    },
  ],
})
const renderSection = () =>
  customRender(
    <WarehouseWorkersSection
      range={{
        status: 'ok',
        startDate: '2026-11-18T00:00:00Z',
        endDate: '2026-11-18T01:00:00Z',
        interval: '1m',
        isClamped: false,
      }}
    />,
    { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }
  )

test('shows worker starts and requests with their API labels', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      const attributes = new URL(request.url).searchParams.get('attributes')?.split(',')
      expect(attributes).toEqual([
        'activation_rate',
        'activation_duration_mean',
        'activation_duration_p95',
        'rpc_rate',
        'rpc_duration_mean',
        'rpc_duration_p95',
      ])
      const starts = metric('activation_rate')
      starts.series.push({ ...starts.series[0], labels: { kind: 'cold', result: 'success' } })
      const requests = metric('rpc_rate')
      requests.series.push({
        ...requests.series[0],
        labels: { method: 'metadata', status: 'error' },
      })
      return HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [
          starts,
          metric('activation_duration_mean'),
          metric('activation_duration_p95'),
          requests,
          metric('rpc_duration_mean'),
          metric('rpc_duration_p95'),
        ],
      })
    },
  })
  renderSection()
  expect(screen.getByRole('status')).toHaveTextContent('Loading worker metrics')
  const starts = await screen.findByRole('region', { name: 'Worker starts' })
  expect(within(starts).getByText(/warm/)).toBeInTheDocument()
  expect(within(starts).getByText(/cold/)).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Worker start time' })).toBeInTheDocument()
  const requests = screen.getByRole('region', { name: 'Requests by method' })
  expect(within(requests).getByText('Requests by method · query · ok')).toBeInTheDocument()
  expect(within(requests).getByText('Requests by method · metadata · error')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Request duration' })).toBeInTheDocument()
  expect(screen.getByText(/split by method and status. Not a count/)).toBeInTheDocument()
  expect(screen.getByText('Worker metrics loaded')).toBeInTheDocument()
})

test('keeps worker failures recoverable', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 }),
  })
  renderSection()
  expect(await screen.findByText('Failed to retrieve worker metrics')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Could not load worker metrics')
})
