import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'

import { WarehouseCapacitySection } from './WarehouseCapacitySection'
import { WarehouseMetricChart } from './WarehouseMetricChart'
import { expandWarehouseChartSeries, getWarehouseChartPoints } from './WarehouseMetricChart.utils'
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
  unit: name === 'admission_rejection_rate' ? 'per_second' : 'grants',
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
const renderSection = () =>
  customRender(
    <WarehouseCapacitySection
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

test('shows capacity limits and labelled rejection reasons without dropping zeroes', async () => {
  const rejection = metric('admission_rejection_rate')
  rejection.series = [
    {
      ...rejection.series[0],
      labels: { reason: 'overloaded' },
      points: [{ timestamp: 160, value: 0 }],
    },
    {
      ...rejection.series[0],
      labels: { reason: 'disabled' },
      points: [{ timestamp: 160, value: 1 }],
    },
  ]
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: ({ request }) => {
      expect(new URL(request.url).searchParams.get('attributes')?.split(',')).toHaveLength(5)
      return HttpResponse.json<WarehouseMetricsResponse>({
        metrics: [metric('worker_admission_occupied'), metric('worker_admission_limit'), rejection],
      })
    },
  })
  renderSection()
  expect(screen.getByRole('status')).toHaveTextContent('Loading capacity metrics')
  expect(await screen.findByRole('region', { name: 'Worker slots' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Rejected requests series' })).toHaveTextContent(
    'Rejected requests · disabledRejected requests · overloaded'
  )
  expect(screen.getByText('Some measurements are unavailable')).toBeInTheDocument()
  expect(
    getWarehouseChartPoints(
      expandWarehouseChartSeries([{ metric: rejection, label: 'Rejected' }]),
      1
    )
  ).toEqual([{ timestamp: new Date(160000).toISOString(), value0: 1, value1: 0 }])
})

test('keeps capacity errors recoverable', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/metrics',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 }),
  })
  renderSection()
  expect(await screen.findByText('Failed to retrieve capacity metrics')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Could not load capacity metrics')
})

test('limits large labelled responses and tells the user which series are shown', () => {
  const rejection = metric('admission_rejection_rate')
  rejection.series = Array.from({ length: 13 }, (_, index) => ({
    ...rejection.series[0],
    labels: { reason: `reason-${index.toString().padStart(2, '0')}` },
  }))
  customRender(
    <WarehouseMetricChart
      metric={rejection}
      title="Rejected requests"
      description="By reason"
      unit="/s"
    />
  )
  expect(screen.getByText('Showing 12 of 13 series')).toBeInTheDocument()
  expect(screen.queryByText('Rejected requests · reason-12')).not.toBeInTheDocument()
})

test.each([
  { earlierValue: null, lastValue: 0 },
  { earlierValue: 0, lastValue: 1 },
])(
  'keeps activity ahead of empty or zero-only series ($earlierValue)',
  ({ earlierValue, lastValue }) => {
    const rejection = metric('admission_rejection_rate')
    rejection.series = Array.from({ length: 13 }, (_, index) => ({
      ...rejection.series[0],
      labels: { reason: `reason-${index.toString().padStart(2, '0')}` },
      points: [{ timestamp: 160, value: index === 12 ? lastValue : earlierValue }],
    }))
    customRender(
      <WarehouseMetricChart
        metric={rejection}
        title="Rejected requests"
        description="By reason"
        unit="/s"
      />
    )
    expect(screen.getByText('Showing 12 of 13 series')).toBeInTheDocument()
    expect(screen.getByText('Rejected requests · reason-12')).toBeInTheDocument()
    expect(screen.queryByText('No data in the selected period')).not.toBeInTheDocument()
  }
)
