import { screen } from '@testing-library/react'
import type { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'

import { createWarehouseMetric, createWarehouseMetricsResponse } from './WarehouseMetrics.fixtures'
import { WarehouseMetricsReport } from './WarehouseMetricsReport'
import type {
  WarehouseMetric,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const FIRST_ATTRIBUTE = 'query_rate'
const LATENCY_ATTRIBUTE = 'query_duration_mean'

const getAttributes = (request: Request) =>
  (new URL(request.url).searchParams.get('attributes') ?? '')
    .split(',')
    .filter(Boolean) as WarehouseMetricName[]

type MetricOverrides = (attributes: WarehouseMetricName[]) => Partial<WarehouseMetric> | undefined
type WarehouseSetupStatus = components['schemas']['WarehouseSetupStatusResponse_Output']

const mockSetupStatus = (setup_status: WarehouseSetupStatus['setup_status']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () =>
      HttpResponse.json<WarehouseSetupStatus>({
        setup_status,
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
      }),
  })

const mockMetrics = (overrides: MetricOverrides = () => undefined) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      const attributes = getAttributes(request)
      return HttpResponse.json<WarehouseMetricsResponse>(
        createWarehouseMetricsResponse(attributes, overrides(attributes))
      )
    },
  })

describe('WarehouseMetricsReport', () => {
  beforeEach(() => {
    // The date range hook looks up the project to resolve the plan; its result doesn't matter here
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
    })
  })

  test('shows loading skeletons while metrics load', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: () => new Promise<never>(() => {}),
    })

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findAllByLabelText(/^Loading /)).toHaveLength(12)
  })

  test('renders every section and chart title once metrics load', async () => {
    mockMetrics()

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Queries')).toBeInTheDocument()
    expect(await screen.findByText('Latency')).toBeInTheDocument()
    expect(await screen.findByText('Capacity')).toBeInTheDocument()
    expect(await screen.findByText('Workers and requests')).toBeInTheDocument()
    expect(await screen.findByText('Query rate')).toBeInTheDocument()
    expect(await screen.findByText('Worker slots')).toBeInTheDocument()
    expect(await screen.findByText('Request duration')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Warehouse reports documentation (opens in new tab)' })
    ).toHaveAttribute('href', expect.stringContaining('/guides/observability/reports#warehouse'))
  })

  test('shows the empty state with a link to the integration when Warehouse is not provisioned', async () => {
    mockMetrics(() => ({ availability: 'not_provisioned', series: [] }))
    mockSetupStatus('not_started')

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Warehouse is not set up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
  })

  test('shows the disabled empty state when Warehouse is disabled', async () => {
    mockMetrics(() => ({ availability: 'disabled', series: [] }))
    mockSetupStatus('disabled')

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Warehouse is disabled')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
  })

  test.each([
    ['not_provisioned', 'complete'],
    ['disabled', 'complete'],
    ['not_provisioned', 'copying'],
  ] as const)(
    'does not claim Warehouse needs setup when metrics report %s and setup is %s',
    async (availability, setupStatus) => {
      mockMetrics(() => ({ availability, series: [] }))
      mockSetupStatus(setupStatus)

      customRender(<WarehouseMetricsReport />)

      await screen.findByRole('link', { name: /^(View|Set up) Warehouse$/ })
      expect(screen.getByText('Warehouse metrics are unavailable')).toBeInTheDocument()
      expect(screen.queryByText('Warehouse is not set up')).not.toBeInTheDocument()
      expect(screen.queryByText('Warehouse is disabled')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Set up Warehouse' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View Warehouse' })).toHaveAttribute(
        'href',
        '/project/default/integrations/warehouse/overview'
      )
    }
  )

  test('checks actual setup before claiming Warehouse is not configured', async () => {
    mockMetrics(() => ({ availability: 'not_provisioned', series: [] }))
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () => new Promise<never>(() => {}),
    })

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Checking Warehouse status...')).toBeInTheDocument()
    expect(screen.queryByText('Warehouse is not set up')).not.toBeInTheDocument()
  })

  test('shows a setup-status failure without assuming Warehouse is not set up', async () => {
    mockMetrics(() => ({ availability: 'not_provisioned', series: [] }))
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Status unavailable' }, { status: 500 }),
    })

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Failed to check Warehouse status')).toBeInTheDocument()
    expect(screen.queryByText('Warehouse is not set up')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Set up Warehouse' })).not.toBeInTheDocument()
  })

  test('shows an error for the failing section while the other sections still render', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: ({ request }) => {
        const attributes = getAttributes(request)
        if (attributes.includes(LATENCY_ATTRIBUTE)) {
          return HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 })
        }
        return HttpResponse.json<WarehouseMetricsResponse>(
          createWarehouseMetricsResponse(attributes)
        )
      },
    })

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Failed to retrieve latency data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(await screen.findByText('Query rate')).toBeInTheDocument()
    expect(await screen.findByText('Worker slots')).toBeInTheDocument()
    expect(screen.queryByText('Failed to retrieve Warehouse metrics')).not.toBeInTheDocument()
  })

  test('shows a placeholder instead of a chart when a metric has no data', async () => {
    mockMetrics((attributes) =>
      attributes.includes(FIRST_ATTRIBUTE) ? { availability: 'no_data', series: [] } : undefined
    )

    customRender(<WarehouseMetricsReport />)

    // The override applies to every chart in the Queries section
    expect(await screen.findAllByText('No data to show')).toHaveLength(3)
    expect(await screen.findByText('Query rate')).toBeInTheDocument()
  })

  test('shows the last sample time for stale metrics', async () => {
    mockMetrics((attributes) =>
      attributes.includes(FIRST_ATTRIBUTE)
        ? {
            ...createWarehouseMetric(FIRST_ATTRIBUTE),
            availability: 'stale',
            series: [],
            last_sample_at: Math.floor(Date.now() / 1000) - 3 * 60 * 60,
          }
        : undefined
    )

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findAllByText('No recent data')).not.toHaveLength(0)
    expect(await screen.findAllByText(/Last sample 3 hours ago/)).not.toHaveLength(0)
  })
})
