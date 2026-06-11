import { screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { DestinationRow } from './DestinationRow'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

// Select/Tooltip/Popover descendants use Web Animations
mockAnimationsApi()

// Prevent retries on mocked error responses — replication queries override the
// QueryClient default with checkReplicationFeatureFlagRetry, which retries up to
// 3 times. Without this mock the error tests would either time-out or require
// fake timers.
vi.mock('@/data/replication/utils', () => ({
  checkReplicationFeatureFlagRetry: () => false,
}))

// DestinationRow uses usePipelineRequestStatus which requires its context provider.
// Mock the module so we don't need to wrap every test with the provider.
vi.mock('@/state/replication-pipeline-request-status', () => ({
  PipelineStatusRequestStatus: {
    None: 'None',
    StartRequested: 'StartRequested',
    StopRequested: 'StopRequested',
    RestartRequested: 'RestartRequested',
  },
  usePipelineRequestStatus: () => ({
    getRequestStatus: () => 'None',
    updatePipelineStatus: () => {},
  }),
}))

const DESTINATION_ID = 1
const PIPELINE_ID = 42

const addSourcesMock = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () =>
      HttpResponse.json({
        sources: [
          {
            tenant_id: 't',
            id: 1,
            name: 'default',
            config: { host: 'db.internal', port: 5432, name: 'main-db', username: 'etl_user' },
          },
        ],
      }),
  })

const addDestinationMock = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations/:destination_id',
    response: () =>
      HttpResponse.json({
        tenant_id: 't',
        id: DESTINATION_ID,
        name: 'My BigQuery Destination',
        config: {
          big_query: { project_id: 'gcp-proj', dataset_id: 'analytics', service_account_key: '{}' },
        },
      }),
  })

const addPipelinesMock = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json({
        pipelines: [
          {
            id: PIPELINE_ID,
            tenant_id: 't',
            source_id: 1,
            source_name: 'main-db',
            destination_id: DESTINATION_ID,
            destination_name: 'My BigQuery Destination',
            replicator_id: 9001,
            config: { publication_name: 'supabase_realtime' },
          },
        ],
      }),
  })

const addPipelineStatusMock = (statusName = 'started') =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () => HttpResponse.json({ pipeline_id: PIPELINE_ID, status: { name: statusName } }),
  })

const addReplicationStatusMock = (
  confirmedFlushLsnBytes: number,
  tableStatuses: Array<{
    table_id: number
    table_name: string
    state: { name: 'error'; reason: string; retry_policy: { policy: 'no_retry' } }
  }> = []
) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
    response: () =>
      HttpResponse.json({
        pipeline_id: PIPELINE_ID,
        apply_lag: {
          active: true,
          wal_status: 'reserved' as const,
          restart_lsn_bytes: 0,
          confirmed_flush_lsn_bytes: confirmedFlushLsnBytes,
          safe_wal_size_bytes: null,
        },
        table_statuses: tableStatuses,
      }),
  })

const addVersionMock = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
    response: () =>
      HttpResponse.json({ pipeline_id: PIPELINE_ID, version: { id: 1, name: 'v0.3.0' } }),
  })

const setupMocks = ({
  lagBytes = 0,
  statusName = 'started',
  tableStatuses = [],
}: {
  lagBytes?: number
  statusName?: string
  tableStatuses?: Parameters<typeof addReplicationStatusMock>[1]
} = {}) => {
  addSourcesMock()
  addDestinationMock()
  addPipelinesMock()
  addPipelineStatusMock(statusName)
  addReplicationStatusMock(lagBytes, tableStatuses)
  addVersionMock()
}

describe('DestinationRow — lag column', () => {
  test('shows "Caught up" when confirmed_flush_lsn_bytes is 0', async () => {
    setupMocks({ lagBytes: 0 })
    customRender(<DestinationRow destinationId={DESTINATION_ID} />)
    expect(await screen.findByText('Caught up')).toBeInTheDocument()
  })

  test('shows formatted lag value when confirmed_flush_lsn_bytes is non-zero', async () => {
    setupMocks({ lagBytes: 2048 })
    customRender(<DestinationRow destinationId={DESTINATION_ID} />)
    expect(await screen.findByText('2 KB')).toBeInTheDocument()
  })

  test('shows publication name from pipeline config', async () => {
    setupMocks()
    customRender(<DestinationRow destinationId={DESTINATION_ID} />)
    expect(await screen.findByText('supabase_realtime')).toBeInTheDocument()
  })
})

describe('DestinationRow — pipeline status column', () => {
  test('shows Running badge when pipeline is started', async () => {
    setupMocks({ statusName: 'started' })
    customRender(<DestinationRow destinationId={DESTINATION_ID} />)
    expect(await screen.findByText('Running')).toBeInTheDocument()
  })

  test('shows Failed badge when pipeline has failed', async () => {
    setupMocks({ statusName: 'failed' })
    customRender(<DestinationRow destinationId={DESTINATION_ID} />)
    expect(await screen.findByText('Failed')).toBeInTheDocument()
  })

  test('shows Stopped badge when pipeline is stopped', async () => {
    setupMocks({ statusName: 'stopped' })
    customRender(<DestinationRow destinationId={DESTINATION_ID} />)
    expect(await screen.findByText('Stopped')).toBeInTheDocument()
  })
})

describe('DestinationRow — table errors', () => {
  afterEach(() => vi.useRealTimers())

  test('shows warning icon when tables have replication errors', async () => {
    setupMocks({
      tableStatuses: [
        {
          table_id: 1,
          table_name: 'public.orders',
          state: { name: 'error', reason: 'table not found', retry_policy: { policy: 'no_retry' } },
        },
      ],
    })

    const { container } = customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    // Wait for the row to finish loading
    await screen.findByText('Caught up')

    // WarningIcon renders with the bg-warning-600 class (from StatusIcon.tsx)
    expect(container.querySelector('.bg-warning-600')).toBeInTheDocument()
  })

  test('does not show warning icon when pipeline is stopped even with table errors', async () => {
    setupMocks({
      statusName: 'stopped',
      tableStatuses: [
        {
          table_id: 1,
          table_name: 'public.orders',
          state: { name: 'error', reason: 'table not found', retry_policy: { policy: 'no_retry' } },
        },
      ],
    })

    const { container } = customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    await screen.findByText('Stopped')

    // hasTableErrors is suppressed when the pipeline is stopped
    expect(container.querySelector('.bg-warning-600')).not.toBeInTheDocument()
  })
})

describe('DestinationRow — pipeline error', () => {
  test('shows error when the pipelines API fails', async () => {
    addSourcesMock()
    addDestinationMock()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Internal server error' }, { status: 500 }),
    })

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Failed to retrieve pipeline information')).toBeInTheDocument()
  })
})
