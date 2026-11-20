import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents as components } from 'api-types'
import dayjs from 'dayjs'
import { HttpResponse } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'

import { WarehouseMetricsReport } from './WarehouseMetricsReport'
import { organizationKeys } from '@/data/organizations/keys'
import { projectKeys } from '@/data/projects/keys'
import type { WarehouseMetricsResponse } from '@/data/warehouse/warehouse-metrics-api-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type Setup = components['schemas']['WarehouseSetupStatusResponse_Output']
const setup: Setup = {
  setup_status: 'complete',
  steps: [],
  tables: [],
  fdw_status: {
    extension_available: true,
    extension_installed: true,
    foreign_schema_imported: true,
    schema_created: true,
    server_configured: true,
    wrapper_installed: true,
  },
}
const mockSetup = (status: Setup['setup_status'] = 'complete') =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () => HttpResponse.json<Setup>({ ...setup, setup_status: status }),
  })
const response = (value: number | null): WarehouseMetricsResponse => ({
  metrics: [
    {
      project_ref: 'default',
      metric: 'query_rate',
      unit: 'per_second',
      aggregation: 'rate',
      definition: 'Query rate',
      requested: { metric: 'query_rate', start: 1794877200, end: 1794877260, step: 60 },
      effective: { start: 1794877200, end: 1794877260, step: 60, rate_window_seconds: 300 },
      scrape_interval_seconds: 60,
      last_sample_at: 1794877260,
      availability: value === null ? 'no_data' : 'ok',
      series: [
        {
          labels: {},
          coverage: { returned_points: 2, expected_points: 2 },
          points: [
            { timestamp: 1794877200, value: null },
            { timestamp: 1794877260, value },
          ],
        },
      ],
    },
  ],
})
const mockMetrics = (value: number | null) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<WarehouseMetricsResponse>(response(value)),
  })
const renderReport = (enabled = true) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(['warehouse-configcat-flag', 'default'], enabled ? ['free-org'] : [])
  queryClient.setQueryData(projectKeys.detail('default'), { organization_id: 1 })
  queryClient.setQueryData(organizationKeys.list(), [
    { id: 1, slug: 'free-org', plan: { id: 'free' } },
  ])
  queryClient.setQueryData(organizationKeys.entitlements('free-org'), {
    entitlements: [
      {
        feature: { key: 'log.retention_days' },
        type: 'numeric',
        config: { enabled: true, unlimited: false, value: 1 },
      },
    ],
  })
  return customRender(<WarehouseMetricsReport />, { queryClient, nuqs: { hasMemory: true } })
}
beforeEach(() => {
  mockSetup()
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
})
test('shows no data for the selected period', async () => {
  mockMetrics(null)
  renderReport()
  expect(await screen.findByText('No data in the selected period')).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'Report status' })).toHaveTextContent(
    'Warehouse report: No data in the selected period'
  )
})
test('renders measured zero as query activity', async () => {
  mockMetrics(0)
  renderReport()
  expect(
    await screen.findByText('Queries started per second. Not a count of SQL statements.')
  ).toBeInTheDocument()
  expect(screen.queryByText('No data in the selected period')).not.toBeInTheDocument()
})
test.each(['not_started', 'disabled'] as const)(
  'offers setup when Warehouse is %s',
  async (status) => {
    mockSetup(status)
    mockMetrics(null)
    renderReport()
    expect(await screen.findByRole('link', { name: 'Set up Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
  }
)
test('shows a request failure rather than a no-data state', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 }),
  })
  renderReport()
  expect(await screen.findByText('Failed to retrieve Warehouse metrics')).toBeInTheDocument()
})

test('requests the period selected in the date picker', async () => {
  const requests: URL[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json<WarehouseMetricsResponse>(response(null))
    },
  })
  renderReport()
  await screen.findByText('No data in the selected period')
  await userEvent.click(screen.getByRole('button', { name: /Last 60 minutes/ }))
  await userEvent.click(screen.getByText('Last 24 hours'))
  await waitFor(() => expect(requests.at(-1)?.searchParams.get('interval')).toBe('5m'))
  const lastRequest = requests.at(-1)!
  expect(
    dayjs(lastRequest.searchParams.get('endDate')).diff(
      dayjs(lastRequest.searchParams.get('startDate')),
      'hour',
      true
    )
  ).toBeCloseTo(24, 2)
})

test('refreshes report measurements without changing the selected period', async () => {
  let requests = 0
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      if (!new URL(request.url).searchParams.get('attributes')?.split(',').includes('query_rate'))
        return HttpResponse.json<WarehouseMetricsResponse>({ metrics: [] })
      requests += 1
      return HttpResponse.json<WarehouseMetricsResponse>(response(requests > 2 ? 4 : null))
    },
  })
  renderReport()
  await screen.findByText('No data in the selected period')
  await userEvent.click(screen.getByRole('button', { name: /Last 60 minutes/ }))
  await userEvent.click(screen.getByText('Last 24 hours'))
  await waitFor(() => expect(requests).toBe(2))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh report' })).toBeEnabled())
  const before = requests
  await userEvent.keyboard('{Shift>}R{/Shift}')
  expect(
    await screen.findByText('Queries started per second. Not a count of SQL statements.')
  ).toBeInTheDocument()
  expect(requests).toBeGreaterThan(before)
  expect(screen.getByRole('button', { name: /Last 24 hours/ })).toBeInTheDocument()
})

test('shows the retention upgrade prompt instead of requesting seven days on a free plan', async () => {
  const metricsRequest = vi.fn(() => HttpResponse.json<WarehouseMetricsResponse>(response(null)))
  addAPIMock({ method: 'get', path: '/platform/warehouse/:ref/metrics', response: metricsRequest })
  renderReport()
  await screen.findByText('No data in the selected period')
  await userEvent.click(screen.getByRole('button', { name: /Last 60 minutes/ }))
  const requestsBefore = metricsRequest.mock.calls.length
  await userEvent.click(screen.getByText('Last 7 days'))
  expect(await screen.findByRole('dialog')).toHaveTextContent('Report date range')
  expect(metricsRequest).toHaveBeenCalledTimes(requestsBefore)
})

test('does not request Warehouse data without access', async () => {
  const setupRequest = vi.fn(() => HttpResponse.json<Setup>(setup))
  const metricsRequest = vi.fn(() => HttpResponse.json<WarehouseMetricsResponse>(response(null)))
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: setupRequest,
  })
  addAPIMock({ method: 'get', path: '/platform/warehouse/:ref/metrics', response: metricsRequest })
  renderReport(false)
  expect(await screen.findByText('Warehouse metrics are unavailable')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Set up Warehouse' })).not.toBeInTheDocument()
  expect(setupRequest).not.toHaveBeenCalled()
  expect(metricsRequest).not.toHaveBeenCalled()
})

test('shows setup status failures when metrics cannot establish activity', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 }),
  })
  mockMetrics(null)
  renderReport()
  expect(await screen.findByText('Failed to retrieve Warehouse status')).toBeInTheDocument()
})

test('refresh recovers a failed setup status request', async () => {
  let requests = 0
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () => {
      requests += 1
      return requests === 1
        ? HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 500 })
        : HttpResponse.json<Setup>(setup)
    },
  })
  mockMetrics(null)
  renderReport()
  await screen.findByText('Failed to retrieve Warehouse status')
  await userEvent.click(screen.getByRole('button', { name: 'Refresh report' }))
  expect(await screen.findByText('No data in the selected period')).toBeInTheDocument()
})

test('opens the date picker with its report shortcut', async () => {
  mockMetrics(null)
  renderReport()
  await screen.findByText('No data in the selected period')
  await userEvent.keyboard('{Shift>}P{/Shift}')
  expect(await screen.findByText('Last 24 hours')).toBeVisible()
})

test('shows query outcomes without treating missing measurements as zero', async () => {
  const data = response(null)
  const metric = data.metrics[0]
  data.metrics.push(
    {
      ...metric,
      metric: 'query_in_flight',
      availability: 'ok',
      series: [{ ...metric.series[0], points: [{ timestamp: 1794877260, value: 0 }] }],
    },
    {
      ...metric,
      metric: 'query_error_rate',
      availability: 'partial',
      series: [{ ...metric.series[0], points: [{ timestamp: 1794877260, value: 0.1 }] }],
    },
    { ...metric, metric: 'query_timeout_rate', availability: 'no_data' },
    { ...metric, metric: 'query_canceled_rate', availability: 'unavailable' }
  )
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      if (!new URL(request.url).searchParams.get('attributes')?.split(',').includes('query_rate'))
        return HttpResponse.json<WarehouseMetricsResponse>({ metrics: [] })
      expect(new URL(request.url).searchParams.get('attributes')?.split(',')).toEqual([
        'query_rate',
        'query_in_flight',
        'query_error_rate',
        'query_timeout_rate',
        'query_canceled_rate',
      ])
      return HttpResponse.json<WarehouseMetricsResponse>(data)
    },
  })
  mockSetup('not_started')
  renderReport()
  const progress = await screen.findByRole('region', { name: 'Queries in progress' })
  expect(
    within(progress).getByText(
      'Queries awaiting completion, including worker waits and result streaming.'
    )
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('region', { name: 'Query errors' })).getByText('Partial data')
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('region', { name: 'Timeouts (included in errors)' })).getByText(
      'No data in the selected period'
    )
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('region', { name: 'Canceled queries' })).getByText(
      'Metrics are temporarily unavailable'
    )
  ).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Set up Warehouse' })).not.toBeInTheDocument()
})
