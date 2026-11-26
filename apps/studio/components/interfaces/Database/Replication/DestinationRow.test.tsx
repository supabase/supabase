import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { Table, TableBody } from 'ui'
import { describe, expect, test, vi } from 'vitest'

import { DestinationRow as DestinationRowComponent } from './DestinationRow'
import type { SlotLagMetrics } from './ReplicationPipelineStatus/ReplicationPipelineStatus.types'
import type { DestinationWireResponse } from '@/data/replication/api-types'
import { API_URL } from '@/lib/constants'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type ReplicationPipelinesResponse = components['schemas']['PipelinesResponse_Output']
type ReplicationDestinationResponse = DestinationWireResponse<
  components['schemas']['DestinationResponse_Output']
>
type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type ReplicationPipelineStatusResponse = components['schemas']['PipelineStatusResponse_Output']
type ReplicationPipelineReplicationStatusResponse =
  components['schemas']['PipelineReplicationStatusResponse_Output']
type ReplicationPipelineVersionResponse = components['schemas']['PipelineVersionResponse_Output']

// Tooltip/Popover descendants use Web Animations
mockAnimationsApi()

const DestinationRow = (props: { destinationId: number }) => (
  <PipelineRequestStatusProvider>
    <DestinationRowComponent {...props} />
  </PipelineRequestStatusProvider>
)

const DESTINATION_ID = 1
const PIPELINE_ID = '42'

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
            config: {
              host: 'db.internal',
              port: 5432,
              name: 'main-db',
              username: 'etl_user',
            },
          },
        ],
      }),
  })

const addDestinationMock = (config?: ReplicationDestinationResponse['config']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations/:destination_id',
    response: () =>
      HttpResponse.json<ReplicationDestinationResponse>({
        tenant_id: 't',
        id: DESTINATION_ID,
        name: 'My BigQuery Destination',
        config: config ?? {
          big_query: {
            project_id: 'gcp-proj',
            dataset_id: 'analytics',
            connection_pool_size: 5,
          },
        },
      }),
  })

const addPipelinesMock = (waitForResponse?: Promise<void>) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: async ({ request }) => {
      await waitForResponse
      return HttpResponse.json<ReplicationPipelinesResponse>({
        pipelines: [
          {
            id: PIPELINE_ID,
            tenant_id: 't',
            cluster_id: new URL(request.url).searchParams.get('cluster_id') ?? 'c',
            source_id: 1,
            source_name: 'main-db',
            destination_id: DESTINATION_ID,
            destination_name: 'My BigQuery Destination',
            replicator_id: 9001,
            config: {
              publication_name: 'supabase_realtime',
              table_sync_copy: { type: 'include_all_tables' },
            },
          },
        ],
      })
    },
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

const addVersionMock = (hasUpdate = false) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
    response: () =>
      HttpResponse.json<ReplicationPipelineVersionResponse>({
        pipeline_id: PIPELINE_ID,
        version: { id: 1, name: 'v0.3.0' },
        ...(hasUpdate ? { new_version: { id: 2, name: 'v0.4.0' } } : {}),
      }),
  })

describe('DestinationRow', () => {
  const addAllMocks = () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0)
    addVersionMock()
  }

  test.each(['started', 'stopped', 'failed'] as const)(
    'only offers stopping and deletion for an unknown destination when %s',
    async (status) => {
      addAllMocks()
      addDestinationMock({ unknown: {} })
      addPipelineStatusMock(status)
      addVersionMock(true)

      customRender(<DestinationRow destinationId={DESTINATION_ID} />)

      expect(await screen.findByRole('img', { name: 'Unknown destination' })).toBeVisible()
      await userEvent.click(await screen.findByRole('button', { name: 'Pipeline options' }))
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'View details',
        'View logs',
        ...(status === 'stopped' ? [] : ['Stop pipeline']),
        'Delete pipeline',
      ])
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete pipeline' }))
      expect(await screen.findByPlaceholderText('Type the pipeline name')).toBeVisible()
    }
  )

  test.each(['started', 'failed'] as const)(
    'stops an unknown destination pipeline when %s',
    async (status) => {
      addAllMocks()
      addDestinationMock({ unknown: {} })
      addPipelineStatusMock(status)
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
        response: () => {
          addPipelineStatusMock('stopped')
          return HttpResponse.json<Record<string, never>>({}, { status: 202 })
        },
      })

      customRender(<DestinationRow destinationId={DESTINATION_ID} />)
      await screen.findByRole('img', { name: 'Unknown destination' })
      await screen.findByText(status === 'started' ? 'Running' : 'Failed')
      await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Stop pipeline' }))
      expect(await screen.findByText('Stopped')).toBeVisible()
    }
  )

  test('shows the destination before its pipeline details load', async () => {
    let finishPipelineRequest = () => {}
    const pendingPipeline = new Promise<void>((resolve) => {
      finishPipelineRequest = resolve
    })
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock(pendingPipeline)
    addPipelineStatusMock('started')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(
      <Table>
        <TableBody>
          <DestinationRow destinationId={DESTINATION_ID} />
        </TableBody>
      </Table>
    )

    const row = (await screen.findByText('My BigQuery Destination')).closest('tr')
    expect(row).toBeInTheDocument()
    expect(row).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button', { name: 'Pipeline options' })).not.toBeInTheDocument()

    await act(async () => finishPipelineRequest())

    expect(await screen.findByRole('button', { name: 'Pipeline options' })).toBeInTheDocument()
    expect(row).toHaveAttribute('tabindex', '0')
  })

  test('starts only the selected cluster when two rows share a pipeline ID', async () => {
    addAllMocks()
    const clusterIds = ['2', '3']
    const start = Promise.withResolvers<void>()
    const startRequests: { clusterId: string | null; pipelineId: unknown }[] = []
    const startedClusters = new Set<string | null>()
    const getClusterId = (request: Request) => new URL(request.url).searchParams.get('cluster_id')

    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: ({ request }) => {
        const clusterId = getClusterId(request)
        return HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: PIPELINE_ID,
          status: {
            name: startedClusters.has(clusterId) ? 'started' : 'stopped',
          },
        })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/start',
      response: async ({ request, params }) => {
        const clusterId = getClusterId(request)
        startRequests.push({ clusterId, pipelineId: params.pipeline_id })
        await start.promise
        startedClusters.add(clusterId)
        return HttpResponse.json<Record<string, never>>({})
      },
    })

    customRender(
      <PipelineRequestStatusProvider>
        <Table>
          <TableBody>
            {clusterIds.map((clusterId) => (
              <ReplicationClusterProvider key={clusterId} clusterId={clusterId}>
                <DestinationRowComponent destinationId={DESTINATION_ID} />
              </ReplicationClusterProvider>
            ))}
          </TableBody>
        </Table>
      </PipelineRequestStatusProvider>
    )

    const [firstRow, secondRow] = (await screen.findAllByRole('row')).map((row) => within(row))
    const user = userEvent.setup()
    try {
      expect(await firstRow.findByText('Stopped')).toBeVisible()
      expect(await secondRow.findByText('Stopped')).toBeVisible()
      await user.click(firstRow.getByRole('button', { name: 'Pipeline options' }))
      await user.click(screen.getByRole('menuitem', { name: 'Start pipeline' }))

      expect(await firstRow.findByText('Starting')).toBeVisible()
      expect(secondRow.getByText('Stopped')).toBeVisible()
      await waitFor(() =>
        expect(startRequests).toEqual([{ clusterId: '2', pipelineId: PIPELINE_ID }])
      )

      start.resolve()
      expect(await firstRow.findByText('Running')).toBeVisible()
      expect(secondRow.getByText('Stopped')).toBeVisible()
    } finally {
      start.resolve()
    }
  })

  test('waits for shutdown and deletes from the original cluster after switching clusters', async () => {
    addAllMocks()
    routerMock.setCurrentUrl('/project/default/database/pipelines')
    const originalClusterId = 'original-cluster'
    const otherClusterId = 'other-cluster'
    let isStopping = false
    const shutdown = Promise.withResolvers<void>()
    const shutdownStatusRequested = vi.fn()
    const otherClusterStatusRequested = vi.fn()
    const stopRequested = vi.fn()
    const deleted = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
      response: ({ request, params }) => {
        stopRequested(new URL(request.url).searchParams.get('cluster_id'), params.pipeline_id)
        isStopping = true
        return HttpResponse.json<Record<string, never>>({}, { status: 202 })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: async ({ request, params }) => {
        const clusterId = new URL(request.url).searchParams.get('cluster_id')
        const isShuttingDown = isStopping && clusterId === originalClusterId
        if (isShuttingDown) {
          shutdownStatusRequested()
          await shutdown.promise
        }
        if (clusterId === otherClusterId) otherClusterStatusRequested(params.pipeline_id)
        return HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: PIPELINE_ID,
          status: { name: isShuttingDown ? 'stopped' : 'started' },
        })
      },
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/replication/:ref/destinations-pipelines/:destination_id/:pipeline_id',
      response: ({ request, params }) => {
        deleted(
          new URL(request.url).searchParams.get('cluster_id'),
          params.destination_id,
          params.pipeline_id
        )
        return HttpResponse.json<components['schemas']['DeleteDestinationPipelineResponse_Output']>(
          {
            destination_deleted: true,
            destination_id: DESTINATION_ID,
            pipeline_id: PIPELINE_ID,
          }
        )
      },
    })
    const renderRow = (clusterId: string) => (
      <ReplicationClusterProvider clusterId={clusterId}>
        <Table>
          <TableBody>
            <DestinationRow destinationId={DESTINATION_ID} />
          </TableBody>
        </Table>
      </ReplicationClusterProvider>
    )
    const { rerender } = customRender(renderRow(originalClusterId))
    await screen.findByRole('button', { name: 'Pipeline options' })
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete pipeline' }))
    await userEvent.click(screen.getByPlaceholderText('Type the pipeline name'))
    await userEvent.paste('My BigQuery Destination')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Delete pipeline' })).toBeEnabled()
    )
    // jsdom does not reliably submit portalled forms through button activation.
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    try {
      await waitFor(() => expect(shutdownStatusRequested).toHaveBeenCalledOnce())
      expect(stopRequested).toHaveBeenCalledExactlyOnceWith(originalClusterId, PIPELINE_ID)
      expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled()

      rerender(renderRow(otherClusterId))
      await waitFor(() => expect(otherClusterStatusRequested).toHaveBeenCalledWith(PIPELINE_ID))
      expect(deleted).not.toHaveBeenCalled()
    } finally {
      await act(async () => shutdown.resolve())
    }

    await waitFor(() =>
      expect(deleted).toHaveBeenCalledExactlyOnceWith(
        originalClusterId,
        String(DESTINATION_ID),
        PIPELINE_ID
      )
    )
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Deleting…' })).not.toBeInTheDocument()
    )
  })

  test('keeps deletion retryable when shutdown status cannot be verified', async () => {
    addAllMocks()
    routerMock.setCurrentUrl('/project/default/database/pipelines')
    let isStopping = false
    const deleted = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
      response: () => {
        isStopping = true
        return HttpResponse.json<Record<string, never>>({}, { status: 202 })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () => {
        if (isStopping)
          return HttpResponse.json<APIErrorBody>({ message: 'Status unavailable' }, { status: 503 })
        return HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: PIPELINE_ID,
          status: { name: 'started' },
        })
      },
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/replication/:ref/destinations-pipelines/:destination_id/:pipeline_id',
      response: () => {
        deleted()
        return HttpResponse.json<components['schemas']['DeleteDestinationPipelineResponse_Output']>(
          {
            destination_deleted: true,
            destination_id: DESTINATION_ID,
            pipeline_id: PIPELINE_ID,
          }
        )
      },
    })
    const queryClient = new QueryClient()
    customRender(<DestinationRow destinationId={DESTINATION_ID} />, {
      queryClient,
    })
    await screen.findByRole('button', { name: 'Pipeline options' })
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete pipeline' }))
    await userEvent.click(screen.getByPlaceholderText('Type the pipeline name'))
    await userEvent.paste('My BigQuery Destination')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Delete pipeline' })).toBeEnabled()
    )
    // jsdom does not reliably submit portalled forms through button activation.
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() =>
      expect(
        queryClient
          .getMutationCache()
          .getAll()
          .some((mutation) => mutation.state.status === 'error')
      ).toBe(true)
    )
    expect(deleted).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete pipeline' })).toBeEnabled()
  })

  test('navigates to the pipeline when the row is clicked', async () => {
    addAllMocks()
    routerMock.setCurrentUrl('/project/default/database/pipelines')

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    const row = (await screen.findByRole('button', { name: 'Pipeline options' })).closest('tr')
    expect(row).not.toBeNull()
    expect(screen.queryByText(`#${PIPELINE_ID}`)).not.toBeInTheDocument()
    await userEvent.click(row!)

    expect(routerMock.asPath).toBe(`/project/default/database/pipelines/${PIPELINE_ID}`)
  })

  test('does not navigate when the row overflow menu is opened', async () => {
    addAllMocks()
    routerMock.setCurrentUrl('/project/default/database/pipelines')

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    await screen.findByRole('button', { name: 'Pipeline options' })
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))

    expect(routerMock.asPath).toBe('/project/default/database/pipelines')
  })

  test('shows "Caught up" when confirmed_flush_lsn_bytes is 0', async () => {
    addAllMocks()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    const lag = await screen.findByText('Caught up')
    expect(lag.closest('[aria-live="polite"]')).toHaveAttribute('aria-atomic', 'true')
  })

  test('labels a stopped pipeline lag as last reported instead of caught up', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('stopped')
    addReplicationStatusMock(0)
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Last reported')).toBeInTheDocument()
    expect(screen.queryByText('Caught up')).not.toBeInTheDocument()
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

  test('shows unavailable lag instead of caught up when the distance is null', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    // Exercise an unavailable measurement outside the current production OpenAPI contract.
    type UnavailableLagResponse = Omit<
      ReplicationPipelineReplicationStatusResponse,
      'apply_lag'
    > & {
      apply_lag: SlotLagMetrics
    }
    mswServer.use(
      http.get(
        `${API_URL}/platform/replication/:ref/pipelines/:pipeline_id/replication-status`,
        () =>
          HttpResponse.json<UnavailableLagResponse>({
            pipeline_id: PIPELINE_ID,
            apply_lag: {
              active: true,
              wal_status: 'reserved',
              restart_lsn_bytes: 0,
              confirmed_flush_lsn_bytes: null,
              safe_wal_size_bytes: null,
            },
            table_statuses: [],
          })
      )
    )
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Caught up')).not.toBeInTheDocument()
  })

  test('shows initial sync while tables are copying', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0, [
      {
        id: 1,
        schema: 'public',
        name: 'orders',
        table_id: 1,
        table_name: 'public.orders',
        state: { name: 'copying_table' },
      },
    ])
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Initial sync')).toBeInTheDocument()
  })

  test('shows initial sync when apply lag is unavailable', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: () =>
        HttpResponse.json<ReplicationPipelineReplicationStatusResponse>({
          pipeline_id: PIPELINE_ID,
          apply_lag: null,
          table_statuses: [
            {
              id: 1,
              schema: 'public',
              name: 'orders',
              table_id: 1,
              table_name: 'public.orders',
              state: { name: 'queued' },
            },
          ],
        }),
    })
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Initial sync')).toBeInTheDocument()
    expect(screen.queryByText('Lag unavailable')).not.toBeInTheDocument()
  })

  test('announces lag loading and replaces it with the resolved value', async () => {
    let resolveReplicationStatus: (
      response: ReplicationPipelineReplicationStatusResponse
    ) => void = () => {}
    const replicationStatusResponse = new Promise<ReplicationPipelineReplicationStatusResponse>(
      (resolve) => {
        resolveReplicationStatus = resolve
      }
    )

    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: async () =>
        HttpResponse.json<ReplicationPipelineReplicationStatusResponse>(
          await replicationStatusResponse
        ),
    })
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Loading lag')).toBeInTheDocument()

    resolveReplicationStatus({
      pipeline_id: PIPELINE_ID,
      apply_lag: {
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: null,
      },
      table_statuses: [],
    })

    expect(await screen.findByText('Caught up')).toBeInTheDocument()
    expect(screen.queryByText('Loading lag')).not.toBeInTheDocument()
  })

  test('announces when lag is unavailable', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Pipeline unavailable' }, { status: 500 }),
    })
    addVersionMock()

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('Lag unavailable')).toBeInTheDocument()
  })

  test.each([
    ['started', 'Running'],
    ['failed', 'Failed'],
    ['stopped', 'Stopped'],
  ] as const)('shows the %s pipeline status as %s', async (statusName, label) => {
    addAllMocks()
    addPipelineStatusMock(statusName)

    customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    const status = await screen.findByText(label)
    expect(status.closest('[aria-live="polite"]')).toHaveAttribute('aria-atomic', 'true')
  })

  test('shows table errors in the subtext and on the logo when tables have replication errors', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('started')
    addReplicationStatusMock(0, [
      {
        id: 1,
        schema: 'public',
        name: 'orders',
        table_id: 1,
        table_name: 'public.orders',
        state: {
          name: 'error',
          reason: 'table not found',
          retry_policy: { policy: 'no_retry' },
        },
      },
    ])
    addVersionMock()

    const { container } = customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    expect(await screen.findByText('1 table error')).toBeInTheDocument()
    // StatusIcon destructive on the logo corner (packages/ui/src/components/StatusIcon.tsx)
    expect(container.querySelector('.bg-destructive-600')).toBeInTheDocument()
  })

  test('suppresses table error signals when pipeline is stopped even with table errors', async () => {
    addSourcesMock()
    addDestinationMock()
    addPipelinesMock()
    addPipelineStatusMock('stopped')
    addReplicationStatusMock(0, [
      {
        id: 1,
        schema: 'public',
        name: 'orders',
        table_id: 1,
        table_name: 'public.orders',
        state: {
          name: 'error',
          reason: 'table not found',
          retry_policy: { policy: 'no_retry' },
        },
      },
    ])
    addVersionMock()

    const { container } = customRender(<DestinationRow destinationId={DESTINATION_ID} />)

    await screen.findByText('Stopped')

    expect(screen.queryByText(/table error/)).not.toBeInTheDocument()
    expect(container.querySelector('.bg-destructive-600')).not.toBeInTheDocument()
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

    customRender(<DestinationRow destinationId={DESTINATION_ID} />, {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retryDelay: 0 } },
      }),
    })

    expect(await screen.findByText('Failed to retrieve pipeline information')).toBeInTheDocument()
  })
})
