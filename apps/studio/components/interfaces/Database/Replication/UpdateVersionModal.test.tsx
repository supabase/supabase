import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { Button } from 'ui'
import { describe, expect, test, vi } from 'vitest'

import { PipelineStatePill } from './PipelineStatePill'
import { UpdateVersionModal } from './UpdateVersionModal'
import { replicationKeys } from '@/data/replication/keys'
import {
  useReplicationPipelineStatusQuery,
  type ReplicationPipelineStatusResponse,
} from '@/data/replication/pipeline-status-query'
import type { Pipeline } from '@/data/replication/pipelines-query'
import {
  PipelineRequestStatusProvider,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const pipeline: Pipeline = {
  id: 9,
  tenant_id: 'test',
  source_id: 1,
  source_name: 'main',
  destination_id: 1,
  destination_name: 'Analytics',
  replicator_id: 1,
  config: { publication_name: 'analytics' },
}

const StatusView = () => {
  const { data, error, isPending, isError, isSuccess } = useReplicationPipelineStatusQuery({
    projectRef: 'default',
    pipelineId: 9,
  })
  const { getRequestStatus, isRequestPending } = usePipelineRequestStatus()
  return (
    <>
      <PipelineStatePill
        pipelineStatus={data?.status}
        error={error}
        isLoading={isPending}
        isError={isError}
        isSuccess={isSuccess}
        requestStatus={getRequestStatus(9)}
      />
      <Button disabled={isRequestPending(9)}>Another action</Button>
    </>
  )
}

describe('pipeline version updates', () => {
  test.each([
    {
      status: 'started',
      initialLabel: 'Running',
      confirmLabel: 'Update and restart',
      pendingLabel: 'Stopping',
    },
    {
      status: 'stopped',
      initialLabel: 'Stopped',
      confirmLabel: 'Update version',
      pendingLabel: 'Stopped',
    },
    {
      status: 'unknown',
      initialLabel: 'Unknown',
      confirmLabel: 'Update version',
      pendingLabel: 'Unknown',
    },
  ] as const)(
    'honors the backend lifecycle for $status',
    async ({ status, initialLabel, confirmLabel, pendingLabel }) => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const onClose = vi.fn()
      const updates: unknown[] = []
      let complete = () => {}
      const response = new Promise<void>((resolve) => {
        complete = resolve
      })
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
        response: () =>
          HttpResponse.json<ReplicationPipelineStatusResponse>({
            pipeline_id: 9,
            status: { name: status },
          }),
      })
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
        response: () =>
          HttpResponse.json<components['schemas']['PipelineVersionResponse_Output']>({
            pipeline_id: 9,
            version: { id: 1, name: 'v1' },
            new_version: { id: 2, name: 'v2' },
          }),
      })
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
        response: async ({ request }) => {
          updates.push(await request.json())
          await response
          return HttpResponse.json<Record<string, never>>({})
        },
      })
      customRender(
        <PipelineRequestStatusProvider>
          <StatusView />
          <UpdateVersionModal visible pipeline={pipeline} onClose={onClose} />
        </PipelineRequestStatusProvider>,
        { queryClient }
      )
      await screen.findByText(initialLabel)
      await screen.findByText('v2')
      fireEvent.click(screen.getByRole('button', { name: confirmLabel }))
      expect(screen.getByText(pendingLabel)).toBeInTheDocument()
      expect(screen.getByText('Another action').closest('button')).toBeDisabled()
      await act(async () => {
        await queryClient.invalidateQueries(
          { queryKey: replicationKeys.pipelinesStatus('default', 9) },
          { cancelRefetch: false }
        )
      })
      expect(screen.getByText(pendingLabel)).toBeInTheDocument()
      expect(screen.getByText('Another action').closest('button')).toBeDisabled()
      await act(async () => {
        complete()
      })
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
      expect(screen.getByText('Another action').closest('button')).toBeEnabled()
      // There are deliberately no start/stop/restart handlers: the update endpoint owns this.
      expect(updates).toEqual([{ version_id: 2 }])
    }
  )
})
