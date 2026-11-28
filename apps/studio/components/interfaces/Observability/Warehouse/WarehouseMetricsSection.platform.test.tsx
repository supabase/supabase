import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WarehouseCatalogSection } from './WarehouseCatalogSection'
import { WarehouseInlinedDataSection } from './WarehouseInlinedDataSection'
import { WarehouseMaintenanceSection } from './WarehouseMaintenanceSection'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { WarehouseReplicationSection } from './WarehouseReplicationSection'
import { WarehouseTableHealthSection } from './WarehouseTableHealthSection'
import type {
  WarehouseMetric,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { addWarehouseMetricsMock } from '@/tests/lib/warehouse-metrics-mock'

const range: Extract<WarehouseMetricsRange, { status: 'ok' }> = {
  status: 'ok',
  startDate: '2026-11-18T00:00:00Z',
  endDate: '2026-11-18T01:00:00Z',
  interval: '1m',
  isClamped: false,
}

beforeEach(() =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
)

const metric = (
  name: WarehouseMetricName,
  labelSets: Record<string, string>[] = [{ pipeline_id: '1' }],
  value = 1
): WarehouseMetric => ({
  project_ref: 'default',
  metric: name,
  unit: 'per_second',
  aggregation: 'mean',
  definition: name,
  requested: { metric: name, start: 100, end: 160, step: 60 },
  effective: { start: 100, end: 160, step: 60, rate_window_seconds: 60 },
  scrape_interval_seconds: 60,
  last_sample_at: 160,
  availability: 'ok',
  series: labelSets.map((labels) => ({
    labels,
    coverage: { returned_points: 1, expected_points: 1 },
    points: [{ timestamp: 160, value }],
  })),
})

const renderWithClient = (element: ReactElement) =>
  customRender(element, {
    queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  })

const sections: {
  name: string
  element: ReactElement
  attributes: WarehouseMetricName[]
  charts: string[]
}[] = [
  {
    name: 'Replication',
    element: <WarehouseReplicationSection range={range} />,
    attributes: [
      'ingestion_events_received_rate',
      'ingestion_events_processed_rate',
      'ingestion_bytes_received_rate',
      'ingestion_bytes_processed_rate',
      'replication_wal_lag_bytes',
      'replication_receive_wal_lag_bytes',
      'maintenance_pause_active',
      'maintenance_pause_duration_mean',
    ],
    charts: [
      'Replication lag',
      'Change events',
      'Change data',
      'Paused for maintenance',
      'Pause duration',
    ],
  },
  {
    name: 'Maintenance',
    element: <WarehouseMaintenanceSection range={range} />,
    attributes: [
      'maintenance_run_rate',
      'maintenance_request_rate',
      'maintenance_merge_adjacent_files_created_rate',
      'maintenance_rewrite_data_files_created_rate',
      'maintenance_expired_snapshots_rate',
      'maintenance_cleaned_up_files_rate',
    ],
    charts: ['Maintenance runs', 'Maintenance requests', 'Files written', 'Cleanup'],
  },
  {
    name: 'Inlined data',
    element: <WarehouseInlinedDataSection range={range} />,
    attributes: [
      'table_inlined_data_bytes',
      'inline_flush_rows_rate',
      'inline_flush_rows_mean',
      'inline_flush_duration_mean',
    ],
    charts: ['Inlined data by table', 'Rows flushed', 'Rows per flush', 'Flush duration'],
  },
  {
    name: 'Table health',
    element: <WarehouseTableHealthSection range={range} />,
    attributes: [
      'table_active_data_files_mean',
      'table_active_delete_files_mean',
      'table_active_data_bytes_mean',
      'table_active_delete_bytes_mean',
      'table_active_data_file_avg_size_bytes_mean',
      'table_small_file_ratio_mean',
      'table_deleted_row_ratio_mean',
    ],
    charts: [
      'Average files per table',
      'Average size per table',
      'Average file size',
      'Small files and deleted rows',
    ],
  },
  {
    name: 'Catalog',
    element: <WarehouseCatalogSection range={range} />,
    attributes: [
      'catalog_active_data_files',
      'catalog_snapshots',
      'catalog_deletion_backlog_files',
      'catalog_deletion_backlog_bytes',
      'catalog_oldest_snapshot_age',
      'catalog_oldest_deletion_age',
    ],
    charts: [
      'Data files',
      'Snapshots',
      'Deletion backlog',
      'Deletion backlog size',
      'Oldest snapshot and deletion',
    ],
  },
]

describe.each(sections)('$name section', ({ name, element, attributes, charts }) => {
  test('requests exactly its attributes and renders every chart', async () => {
    let requested: string[] | undefined
    addWarehouseMetricsMock(({ request }) => {
      requested = new URL(request.url).searchParams.get('attributes')?.split(',')
      return HttpResponse.json<WarehouseMetricsResponse>({
        metrics: attributes.map((attribute) => metric(attribute)),
      })
    })
    renderWithClient(element)
    const section = await screen.findByRole('region', { name })
    expect(await within(section).findByRole('region', { name: charts[0] })).toBeInTheDocument()
    expect(requested).toEqual(attributes)
    expect(attributes.length).toBeLessThanOrEqual(8)
    for (const chart of charts) {
      expect(within(section).getByRole('region', { name: chart })).toBeInTheDocument()
    }
  })
})

test('hides shared replication labels so the legend stays short', async () => {
  const appliedChanges = { pipeline_id: '1', worker_type: 'apply', replication_path: 'cdc' }
  const data: WarehouseMetricsResponse = {
    metrics: [
      metric('replication_wal_lag_bytes', [appliedChanges]),
      metric('replication_receive_wal_lag_bytes', [appliedChanges]),
    ],
  }
  addWarehouseMetricsMock(() => HttpResponse.json<WarehouseMetricsResponse>(data))
  renderWithClient(<WarehouseReplicationSection range={range} />)

  const legend = await screen.findByRole('list', { name: 'Replication lag series' })
  expect(
    within(legend)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
  ).toEqual(['Replication lag', 'Receive lag'])
})

test('labels the initial copy when a table sync worker reports lag', async () => {
  const appliedChanges = { pipeline_id: '1', worker_type: 'apply', replication_path: 'cdc' }
  const initialCopy = { pipeline_id: '1', worker_type: 'table_sync', replication_path: 'copy' }
  addWarehouseMetricsMock(() =>
    HttpResponse.json<WarehouseMetricsResponse>({
      metrics: [
        metric('replication_wal_lag_bytes', [appliedChanges, initialCopy]),
        metric('replication_receive_wal_lag_bytes', [appliedChanges]),
      ],
    })
  )
  renderWithClient(<WarehouseReplicationSection range={range} />)

  expect(await screen.findByText('Replication lag · Initial copy')).toBeInTheDocument()
  expect(screen.queryByText(/Pipeline/)).not.toBeInTheDocument()
})

test('shows one empty catalog card when no catalog measurement has a value', async () => {
  addWarehouseMetricsMock(({ request }) => {
    const attributes = new URL(request.url).searchParams.get('attributes')?.split(',') ?? []
    expect(attributes).toHaveLength(6)
    return HttpResponse.json<WarehouseMetricsResponse>({
      metrics: sections[4].attributes.map((attribute) => ({
        ...metric(attribute, []),
        availability: 'no_data',
      })),
    })
  })
  renderWithClient(<WarehouseCatalogSection range={range} />)

  expect(await screen.findByText('No catalog metrics in the selected period')).toBeInTheDocument()
  for (const chart of sections[4].charts) {
    expect(screen.queryByRole('region', { name: chart })).not.toBeInTheDocument()
  }
})

test('keeps section errors recoverable', async () => {
  addWarehouseMetricsMock(() =>
    HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 400 })
  )
  renderWithClient(<WarehouseReplicationSection range={range} />)

  expect(await screen.findByText('Failed to retrieve replication metrics')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Could not load replication metrics')
})

test('lists the largest inlined tables with decoded names', async () => {
  const hex = (value: string) => Buffer.from(value).toString('hex')
  const tables = Array.from({ length: 13 }, (_, index) => ({
    pipeline_id: '1',
    table: `v2:${hex('lake')}:${hex('public')}:${hex(`table_${index.toString().padStart(2, '0')}`)}`,
  }))
  addWarehouseMetricsMock(() =>
    HttpResponse.json<WarehouseMetricsResponse>({
      metrics: [
        {
          ...metric('table_inlined_data_bytes', tables),
          series: tables.map((labels, index) => ({
            labels,
            coverage: { returned_points: 1, expected_points: 1 },
            // Reverse the order so the smallest table is not simply the first or last series.
            points: [{ timestamp: 160, value: (index === 0 ? 1 : 100 - index) * 1024 }],
          })),
        },
      ],
    })
  )
  renderWithClient(<WarehouseInlinedDataSection range={range} />)

  const region = await screen.findByRole('region', { name: 'Inlined data by table' })
  expect(await within(region).findByText('Showing 10 of 13 tables')).toBeInTheDocument()

  // The header row is a row too.
  const rows = within(region).getAllByRole('row')
  expect(rows).toHaveLength(11)
  expect(within(rows[1]).getByText('public.table_01')).toBeInTheDocument()
  expect(within(rows[1]).getAllByText('99 KB')).toHaveLength(2)
  expect(within(rows[10]).getByText('public.table_10')).toBeInTheDocument()
  expect(within(region).queryByText('public.table_00')).toBeNull()
  expect(within(region).queryByText(/v2:/)).toBeNull()
})

test('requests section metrics only after the section scrolls into view', async () => {
  const io = mockIntersectionObserver()
  const metricsRequest = vi.fn(() =>
    HttpResponse.json<WarehouseMetricsResponse>({
      metrics: sections[1].attributes.map((attribute) => metric(attribute)),
    })
  )
  addWarehouseMetricsMock(metricsRequest)

  try {
    renderWithClient(<WarehouseMaintenanceSection range={range} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading maintenance metrics')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(metricsRequest).not.toHaveBeenCalled()

    act(() => io.enterAll())
    await waitFor(() => expect(metricsRequest).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('region', { name: 'Maintenance runs' })).toBeInTheDocument()
  } finally {
    // Other tests rely on the missing IntersectionObserver to load sections immediately.
    io.cleanup()
  }
})
