import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'

import { WarehouseWorkloadSection } from './WarehouseWorkloadSection'
import type {
  WarehouseMetric,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const metric = (
  name: WarehouseMetric['metric'],
  availability: WarehouseMetric['availability'] = 'ok'
): WarehouseMetric => ({
  project_ref: 'default',
  metric: name,
  unit: 'seconds',
  aggregation: 'mean',
  definition: name,
  requested: { metric: name, start: 100, end: 160, step: 60 },
  effective: { start: 100, end: 160, step: 60, rate_window_seconds: 60 },
  scrape_interval_seconds: 60,
  last_sample_at: 160,
  availability,
  series:
    availability === 'ok'
      ? [
          {
            labels: {},
            coverage: { returned_points: 1, expected_points: 1 },
            points: [{ timestamp: 160, value: 0 }],
          },
        ]
      : [],
})
const renderSection = () =>
  customRender(<WarehouseWorkloadSection />, {
    queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  })
beforeEach(() =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
)

test('shows both query trends and links to the report', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () =>
      HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [metric('query_rate'), metric('query_duration_p95')],
      }),
  })
  renderSection()
  expect(screen.getByRole('status', { name: 'Workload status' })).toHaveTextContent(
    'Loading workload metrics'
  )
  expect(await screen.findByRole('region', { name: 'Query rate' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Query duration (p95)' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Observability' })).toHaveAttribute(
    'href',
    '/project/default/observability/warehouse'
  )
  expect(screen.queryByText('No data in the last 60 minutes')).not.toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'Workload status' })).toHaveTextContent(
    'Workload metrics loaded'
  )
})

test('names the no-data window and refreshes the measurements', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () =>
      HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [metric('query_rate', 'no_data'), metric('query_duration_p95', 'no_data')],
      }),
  })
  renderSection()
  expect(await screen.findAllByText('No data in the last 60 minutes')).toHaveLength(2)
  let finishRefresh = () => {}
  const refreshedMetrics = new Promise<void>((resolve) => {
    finishRefresh = resolve
  })

  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: async () => {
      await refreshedMetrics
      return HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [metric('query_rate'), metric('query_duration_p95')],
      })
    },
  })
  await userEvent.click(screen.getByRole('button', { name: 'Refresh report' }))
  expect(screen.getByRole('status', { name: 'Workload status' })).toHaveTextContent(
    'Loading workload metrics'
  )
  expect(screen.getAllByText('No data in the last 60 minutes')).toHaveLength(2)
  finishRefresh()

  await waitFor(() =>
    expect(screen.queryAllByText('No data in the last 60 minutes')).toHaveLength(0)
  )
})

test('keeps unavailable metrics distinct from an empty period', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () =>
      HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [metric('query_rate', 'disabled'), metric('query_duration_p95', 'disabled')],
      }),
  })
  renderSection()
  expect(await screen.findByRole('alert')).toHaveTextContent('Warehouse metrics are unavailable')
  expect(screen.getByText('Replication status is shown above.')).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'Workload status' })).toHaveTextContent(
    'Warehouse metrics are unavailable'
  )
  expect(screen.queryByText('No data in the last 60 minutes')).not.toBeInTheDocument()
})

test('announces the error shown after workload metrics fail', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Metrics failed' }, { status: 400 }),
  })

  renderSection()

  expect(await screen.findByText('Failed to load Warehouse metrics')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Workload status' })).toHaveTextContent(
      'Failed to load workload metrics'
    )
  )
  expect(screen.queryByRole('region', { name: 'Query rate' })).not.toBeInTheDocument()
})
