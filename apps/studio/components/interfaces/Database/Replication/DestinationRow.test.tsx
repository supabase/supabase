import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { DestinationRow } from './DestinationRow'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type ReplicationPipelinesResponse = components['schemas']['ReplicationPipelinesResponse']
type ReplicationDestinationResponse = components['schemas']['ReplicationDestinationResponse']
type ReplicationSourcesResponse = components['schemas']['ReplicationSourcesResponse']
type ReplicationPipelineStatusResponse = components['schemas']['ReplicationPipelineStatusResponse']
type ReplicationPipelineReplicationStatusResponse =
  components['schemas']['ReplicationPipelineReplicationStatusResponse']
type ReplicationPipelineVersionResponse =
  components['schemas']['ReplicationPipelineVersionResponse']

// Tooltip/Popover descendants use Web Animations
mockAnimationsApi()

// Prevent retries on mocked error responses — replication queries override the
// QueryClient default with checkReplicationFeatureFlagRetry, which retries up to
// 3 times. Without this mock error tests would time-out.
vi.mock('@/data/replication/utils', () => ({
  checkReplicationFeatureFlagRetry: () => false,
}))

// DestinationRow requires a PipelineRequestStatusContext provider.
// Mock the module so tests don't need to wrap with the provider.
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
      HttpResponse.json<ReplicationSourcesResponse>({
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
      HttpResponse.json<ReplicationDestinationResponse>({
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
      HttpResponse.json<ReplicationPipelinesResponse>({
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

const addPipelineStatusMock = (statusName: ReplicationPipelineStatusResponse['status']['name']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () =>
      HttpResponse.json<ReplicationPipelineStatusResponse>({
        pipeline_id: PIPELINE_ID,
        status: { name: statusName },
      }),
  })

const addReplicationStatusMock = (
  confirmedFlushLsnBytes: number,
  tableStatuses: ReplicationPipelineReplicationStatusResponse['table_statuses'] = []
) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
    response: () =>
      HttpResponse.json<ReplicationPipelineReplicationStatusResponse>({
        pipeline_id: PIPELINE_ID,
        apply_lag: {
          active: true,
          wal_status: 'reserved',
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
      HttpResponse.json<ReplicationPipelineVersionResponse>({
        pipeline_id: PIPELINE_ID,
        version: { id: 1, name: 'v0.3.0' },
      }),
  })

describe('DestinationRow', () => {
  test('shows "Caught up" when confirmed_flush_lsn_bytes is 0', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Caught up')).toBeInTheDocument()
  })

  test('shows formatted lag value when confirmed_flush_lsn_bytes is non-zero', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(2048)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('2 KB')).toBeInTheDocument()
  })

  test('shows publication name from pipeline config', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('supabase_realtime')).toBeInTheDocument()
  })

  test('shows Running badge when pipeline is started', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Running')).toBeInTheDocument()
  })

  test('shows Failed badge when pipeline has failed', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('failed')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Failed')).toBeInTheDocument()
  })

  test('shows Stopped badge when pipeline is stopped', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('stopped')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Stopped')).toBeInTheDocument()
  })

  test('shows warning icon when tables have replication errors', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0, [
      {
        table_id: 1,
        table_name: 'public.orders',
        state: { name: 'error', reason: 'table not found', retry_policy: { policy: 'no_retry' } },
      },
    ])
    addVersionMock()

    const { container } = customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    await screen.findByText('Caught up')

    // WarningIcon renders with bg-warning-600 (from packages/ui/src/components/StatusIcon.tsx)
    expect(container.querySelector('.bg-warning-600')).toBeInTheDocument()
  })

  test('suppresses warning icon when pipeline is stopped even with table errors', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('stopped')
    addReplicationStatusMock(0, [
      {
        table_id: 1,
        table_name: 'public.orders',
        state: { name: 'error', reason: 'table not found', retry_policy: { policy: 'no_retry' } },
      },
    ])
    addVersionMock()

    const { container } = customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    await screen.findByText('Stopped')

    expect(container.querySelector('.bg-warning-600')).not.toBeInTheDocument()
  })

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
