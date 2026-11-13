import { screen, waitFor, within } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineStatus } from './ReplicationPipelineStatus'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '42' }),
}))

type PipelineResponse = components['schemas']['PipelineResponse_Output']
type PipelineStatusResponse = components['schemas']['PipelineStatusResponse_Output']
type PipelineReplicationStatusResponse =
  components['schemas']['PipelineReplicationStatusResponse_Output']

const pipeline: PipelineResponse = {
  id: '42',
  cluster_id: 'cluster',
  config: { publication_name: 'analytics_publication' },
  destination_id: 7,
  destination_name: 'Analytics warehouse',
  replicator_id: 1,
  source_id: 2,
  source_name: 'main-db',
  tenant_id: 'default',
  cluster_id: '1',
}

const mockPipelineQueries = ({
  tableStatuses = [],
  statusName = 'started',
  healthUnavailable = false,
}: {
  tableStatuses?: PipelineReplicationStatusResponse['table_statuses']
  statusName?: PipelineStatusResponse['status']['name']
  healthUnavailable?: boolean
} = {}) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id',
    response: () => HttpResponse.json<PipelineResponse>(pipeline),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () =>
      HttpResponse.json<PipelineStatusResponse>({
        pipeline_id: '42',
        status: { name: statusName },
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
    response: () =>
      healthUnavailable
        ? HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 })
        : HttpResponse.json<PipelineReplicationStatusResponse>({
            pipeline_id: '42',
            apply_lag: {
              active: true,
              wal_status: 'reserved',
              restart_lsn_bytes: 0,
              confirmed_flush_lsn_bytes: 0,
              safe_wal_size_bytes: null,
            },
            table_statuses: tableStatuses,
          }),
  })
}

describe('ReplicationPipelineStatus', () => {
  test.each([
    { label: 'Live', state: { name: 'following_wal' } },
    {
      label: 'Error',
      state: {
        name: 'error',
        reason: 'Write failed',
        retry_policy: { policy: 'manual_retry' },
      },
    },
  ] as const)('marks a stopped table’s $label state as last reported', async ({ label, state }) => {
    mockPipelineQueries({
      statusName: 'stopped',
      tableStatuses: [
        {
          id: 1,
          schema: 'public',
          name: 'events',
          table_id: 1,
          table_name: 'public.events',
          state,
        },
      ],
    })
    customRender(
      <PipelineRequestStatusProvider>
        <ReplicationPipelineStatus />
      </PipelineRequestStatusProvider>
    )

    expect(await screen.findByText(`Last: ${label}`)).toBeVisible()
    expect(screen.queryByText('Streaming changes as they happen')).not.toBeInTheDocument()
    expect(screen.queryByText(/The rest of the pipeline keeps running/)).not.toBeInTheDocument()
  })

  test.each(['stopped', 'started'] as const)(
    'shows unavailable live updates only while the pipeline is running (%s)',
    async (statusName) => {
      mockPipelineQueries({ statusName, healthUnavailable: true })
      customRender(
        <PipelineRequestStatusProvider>
          <ReplicationPipelineStatus />
        </PipelineRequestStatusProvider>
      )

      await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement())
      if (statusName === 'stopped') {
        expect(screen.getByText('Pipeline stopped')).toBeVisible()
        expect(
          screen.getByText('Start the pipeline to replicate changes and view table status.')
        ).toBeVisible()
        expect(screen.queryByText('Live updates paused')).not.toBeInTheDocument()
      } else {
        expect(screen.getByText('Live updates paused')).toBeVisible()
      }
    }
  )

  test('preserves the overview structure while pipeline details load', async () => {
    let resolvePipeline: (value: PipelineResponse) => void = () => {}
    let resolvePipelineStatus: (value: PipelineStatusResponse) => void = () => {}
    const pipelineResponse = new Promise<PipelineResponse>((resolve) => {
      resolvePipeline = resolve
    })
    const pipelineStatusResponse = new Promise<PipelineStatusResponse>((resolve) => {
      resolvePipelineStatus = resolve
    })

    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id',
      response: async () => HttpResponse.json<PipelineResponse>(await pipelineResponse),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: async () => HttpResponse.json<PipelineStatusResponse>(await pipelineStatusResponse),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: () =>
        HttpResponse.json<PipelineReplicationStatusResponse>({
          pipeline_id: '42',
          apply_lag: {
            active: true,
            wal_status: 'reserved',
            restart_lsn_bytes: 0,
            confirmed_flush_lsn_bytes: 0,
            safe_wal_size_bytes: null,
          },
          table_statuses: [],
        }),
    })

    customRender(
      <PipelineRequestStatusProvider>
        <ReplicationPipelineStatus />
      </PipelineRequestStatusProvider>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading pipeline details')
    expect(screen.getByRole('heading', { name: 'Pipeline health' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Replicated tables' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Table' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Details' })).toBeVisible()

    resolvePipeline(pipeline)

    expect(screen.getByRole('status')).toHaveTextContent('Loading pipeline details')

    resolvePipelineStatus({
      pipeline_id: '42',
      status: { name: 'started' },
    })

    expect(await screen.findByText('No table data yet')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  test('defaults to sorting replicated tables by schema and name', async () => {
    // API order is reverse of schema.name, and statuses would reorder differently if status
    // were the default (error before copying before live).
    mockPipelineQueries({
      tableStatuses: [
        {
          id: 3,
          schema: 'public',
          name: 'zebra',
          table_id: 3,
          table_name: 'public.zebra',
          state: {
            name: 'error',
            reason: 'sync failed',
            retry_policy: { policy: 'manual_retry' },
          },
        },
        {
          id: 2,
          schema: 'public',
          name: 'alpha',
          table_id: 2,
          table_name: 'public.alpha',
          state: { name: 'following_wal' },
        },
        {
          id: 1,
          schema: 'auth',
          name: 'users',
          table_id: 1,
          table_name: 'auth.users',
          state: { name: 'copying_table' },
        },
      ],
    })

    customRender(
      <PipelineRequestStatusProvider>
        <ReplicationPipelineStatus />
      </PipelineRequestStatusProvider>
    )

    expect(await screen.findByText('zebra')).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Table' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )

    const table = screen.getByRole('table')
    expect(within(table).getByText('Live')).toBeVisible()
    const tableNames = within(table)
      .getAllByRole('row')
      .map((row) => within(row).queryAllByRole('cell')[0]?.textContent)
      .filter((name): name is string => Boolean(name))

    expect(tableNames).toEqual(['auth.users', 'public.alpha', 'public.zebra'])
  })
})
