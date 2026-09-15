import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineStatus } from './ReplicationPipelineStatus'
import { replicationKeys } from '@/data/replication/keys'
import type { ReplicationPipelineByIdData } from '@/data/replication/pipeline-by-id-query'
import type { ReplicationPipelineReplicationStatusData } from '@/data/replication/pipeline-replication-status-query'
import type { ReplicationPipelineStatusResponse } from '@/data/replication/pipeline-status-query'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '1' }),
}))

const operations = [
  {
    action: 'start',
    initialStatus: 'stopped',
    pendingLabel: 'Starting',
    finalStatus: 'started',
    nextLabel: 'Stop',
  },
  {
    action: 'stop',
    initialStatus: 'started',
    pendingLabel: 'Stopping',
    finalStatus: 'stopped',
    nextLabel: 'Start',
  },
  {
    action: 'restart',
    initialStatus: 'failed',
    pendingLabel: 'Restarting',
    finalStatus: 'started',
    nextLabel: 'Stop',
  },
] as const

const setup = (initialStatus: ReplicationPipelineStatusResponse['status']['name']) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const status: ReplicationPipelineStatusResponse = {
    pipeline_id: 1,
    status: { name: initialStatus },
  }
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id',
    response: () =>
      HttpResponse.json<ReplicationPipelineByIdData>({
        id: 1,
        tenant_id: 't',
        source_id: 1,
        source_name: 'main-db',
        destination_id: 1,
        destination_name: 'Test destination',
        replicator_id: 1,
        config: { publication_name: 'supabase_realtime' },
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () => HttpResponse.json<ReplicationPipelineStatusResponse>(status),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
    response: () =>
      HttpResponse.json<ReplicationPipelineReplicationStatusData>({
        pipeline_id: 1,
        table_statuses: [],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
    response: () =>
      HttpResponse.json<components['schemas']['PipelineVersionResponse_Output']>({
        pipeline_id: 1,
        version: { id: 1, name: 'v1' },
      }),
  })
  customRender(
    <PipelineRequestStatusProvider>
      <ReplicationPipelineStatus />
    </PipelineRequestStatusProvider>,
    { queryClient }
  )
  return { queryClient, status }
}

describe('pipeline primary action', () => {
  test('disables stale actions after a polling error and restores them when status recovers', async () => {
    const { queryClient } = setup('started')
    const button = await screen.findByRole('button', { name: 'Stop' })
    await waitFor(() => expect(button).toBeEnabled())
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Status unavailable' }, { status: 503 }),
    })
    await act(async () => {
      await queryClient.invalidateQueries(
        { queryKey: replicationKeys.pipelinesStatus('default', 1) },
        { cancelRefetch: false }
      )
    })
    await waitFor(() => expect(button).toBeDisabled())
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: 1,
          status: { name: 'started' },
        }),
    })
    await act(async () => {
      await queryClient.invalidateQueries(
        { queryKey: replicationKeys.pipelinesStatus('default', 1) },
        { cancelRefetch: false }
      )
    })
    await waitFor(() => expect(button).toBeEnabled())
  })

  test.each(operations)(
    '$action stays disabled after success until the backend status changes',
    async ({ action, initialStatus, pendingLabel, finalStatus, nextLabel }) => {
      addAPIMock({
        method: 'post',
        path: `/platform/replication/:ref/pipelines/:pipeline_id/${action}`,
        response: () => HttpResponse.json<{ pipeline_id: number }>({ pipeline_id: 1 }),
      })
      const { queryClient, status } = setup(initialStatus)
      const button = await screen.findByRole('button', { name: new RegExp(`^${action}$`, 'i') })
      await waitFor(() => expect(button).toBeEnabled())
      fireEvent.click(button)

      await waitFor(() =>
        expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe('success')
      )
      expect(screen.getByRole('button', { name: pendingLabel })).toBeDisabled()

      status.status.name = finalStatus
      await act(async () => {
        await queryClient.invalidateQueries({
          queryKey: replicationKeys.pipelinesStatus('default', 1),
        })
      })
      await waitFor(() => expect(screen.getByRole('button', { name: nextLabel })).toBeEnabled())
    }
  )

  test.each(operations)('$action allows retry after failure', async ({ action, initialStatus }) => {
    addAPIMock({
      method: 'post',
      path: `/platform/replication/:ref/pipelines/:pipeline_id/${action}`,
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Request failed' }, { status: 503 }),
    })
    const { queryClient } = setup(initialStatus)
    const button = await screen.findByRole('button', { name: new RegExp(`^${action}$`, 'i') })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)

    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe('error')
    )
    await waitFor(() => expect(button).toBeEnabled())
    expect(button).toHaveTextContent(new RegExp(`^${action}$`, 'i'))
  })
})
