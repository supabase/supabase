import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import type { platformComponents as components } from 'api-types'
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
  queryClient.setQueryData(projectKeys.detail('default'), { organization_id: 1 })
  queryClient.setQueryData(organizationKeys.list(), [{ id: 1, slug: 'warehouse-org' }])
  queryClient.setQueryData(
    ['warehouse-configcat-flag', 'default'],
    enabled ? ['warehouse-org'] : []
  )
  return customRender(<WarehouseMetricsReport />, { queryClient })
}

beforeEach(() => {
  mockSetup()
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
})
test('shows an explicit last-hour empty state', async () => {
  mockMetrics(null)
  renderReport()
  expect(await screen.findByText('No data in the last 60 minutes')).toBeInTheDocument()
})
test('renders measured zero as query activity', async () => {
  mockMetrics(0)
  renderReport()
  expect(
    await screen.findByText('Queries started per second. Not a count of SQL statements.')
  ).toBeInTheDocument()
  expect(screen.queryByText('No data in the last 60 minutes')).not.toBeInTheDocument()
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
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 500 }),
  })
  renderReport()
  expect(await screen.findByText('Failed to retrieve Warehouse metrics')).toBeInTheDocument()
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
