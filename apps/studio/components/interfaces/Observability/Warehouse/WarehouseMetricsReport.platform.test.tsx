import { screen } from '@testing-library/react'
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
    expect(screen.getByRole('link', { name: 'Warehouse integration overview' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
  })

  test('shows the empty state with a link to the integration when Warehouse is not provisioned', async () => {
    mockMetrics(() => ({ availability: 'not_provisioned', series: [] }))

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText("Supabase Warehouse isn't enabled")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
  })

  test('shows the disabled empty state when Warehouse is disabled', async () => {
    mockMetrics(() => ({ availability: 'disabled', series: [] }))

    customRender(<WarehouseMetricsReport />)

    expect(await screen.findByText('Supabase Warehouse is disabled')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
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
    expect(await screen.findAllByText('No data in this time range')).toHaveLength(3)
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
