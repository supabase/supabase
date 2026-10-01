import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { BatchRestartDialog } from './BatchRestartDialog'
import { getStatusName } from './Pipeline.utils'
import { PipelineStatePill } from './PipelineStatePill'
import { RestartTableDialog } from './RestartTableDialog'
import { replicationKeys } from '@/data/replication/keys'
import type { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import {
  useReplicationPipelineStatusQuery,
  type ReplicationPipelineStatusResponse,
} from '@/data/replication/pipeline-status-query'
import {
  PipelineRequestStatusProvider,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '9' }),
}))
vi.mock('./RestartCostEstimate', () => ({
  RestartCostEstimate: ({ tables }: { tables: { schema: string; name: string }[] }) => (
    <div data-testid="copy-targets">
      {tables.map(({ schema, name }) => `${schema}.${name}`).join(',')}
    </div>
  ),
}))

const table = (
  id: number,
  state: ReplicationPipelineTableStatus['state']
): ReplicationPipelineTableStatus => ({
  id,
  schema: 'public',
  name: `table_${id}`,
  table_id: id,
  table_name: `public.table_${id}`,
  state,
})

describe('BatchRestartDialog', () => {
  it('describes every table reset by the all-errored backend target', async () => {
    const tables = [
      table(1, { name: 'error', reason: 'manual', retry_policy: { policy: 'manual_retry' } }),
      table(2, { name: 'error', reason: 'terminal', retry_policy: { policy: 'no_retry' } }),
      table(3, {
        name: 'error',
        reason: 'timed',
        retry_policy: { policy: 'timed_retry', next_retry: '2026-07-21T12:00:00Z' },
      }),
      table(4, { name: 'following_wal' }),
    ]

    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: 9,
          status: { name: 'stopped' },
        }),
    })
    const requests: unknown[] = []
    const onOpenChange = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/rollback-tables',
      response: async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json<components['schemas']['RollbackTablesResponse_Output']>({
          pipeline_id: 9,
          tables: [1, 2, 3].map((table_id) => ({ table_id, new_state: { name: 'queued' } })),
        })
      },
    })

    customRender(
      <PipelineRequestStatusProvider>
        <BatchRestartDialog
          open
          onOpenChange={onOpenChange}
          mode="errored"
          tables={tables}
          tableSyncCopy={{ type: 'include_tables', table_ids: [1, 2] }}
        />
      </PipelineRequestStatusProvider>
    )

    expect(screen.getByText(/This resets 3 failed tables/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Existing rows sync again for 2 of 3 tables, while the remaining table skips initial sync/
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId('copy-targets')).toHaveTextContent('public.table_1,public.table_2')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reset failed tables' }))
    })

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(requests).toEqual([{ target: { type: 'all_errored_tables' } }])
  })

  it('uses singular copy when resetting the only table', () => {
    customRender(
      <PipelineRequestStatusProvider>
        <BatchRestartDialog
          open
          onOpenChange={vi.fn()}
          mode="all"
          tables={[table(1, { name: 'following_wal' })]}
          tableSyncCopy={{ type: 'include_tables', table_ids: [1] }}
        />
      </PipelineRequestStatusProvider>
    )

    expect(
      screen.getByText(
        'This resets the table, deletes its destination data, and syncs existing rows again.'
      )
    ).toBeInTheDocument()
  })

  it.each([
    {
      target: 'all',
      initialStatus: 'started',
      optimisticLabel: 'Stopping',
      nextStatus: 'starting',
      nextLabel: 'Starting',
    },
    {
      target: 'single',
      initialStatus: 'started',
      optimisticLabel: 'Stopping',
      nextStatus: 'starting',
      nextLabel: 'Starting',
    },
    {
      target: 'all',
      initialStatus: 'stopped',
      optimisticLabel: 'Stopped',
      nextStatus: 'stopped',
      nextLabel: 'Stopped',
    },
    {
      target: 'single',
      initialStatus: 'stopped',
      optimisticLabel: 'Stopped',
      nextStatus: 'stopped',
      nextLabel: 'Stopped',
    },
  ] as const)(
    'resets $target tables while honoring a $initialStatus pipeline',
    async ({ target, initialStatus, optimisticLabel, nextStatus, nextLabel }) => {
      const onOpenChange = vi.fn()
      const onResetStart = vi.fn()
      const onResetComplete = vi.fn()
      const requests: unknown[] = []
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      let backendStatus: ReplicationPipelineStatusResponse['status']['name'] = initialStatus
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
            status: { name: backendStatus },
          }),
      })
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/rollback-tables',
        response: async ({ request }) => {
          requests.push(await request.json())
          await response
          return HttpResponse.json<components['schemas']['RollbackTablesResponse_Output']>({
            pipeline_id: 9,
            tables: [{ table_id: 1, new_state: { name: 'queued' } }],
          })
        },
      })
      customRender(
        <PipelineRequestStatusProvider>
          <RestartDialogWithStatus
            target={target}
            onOpenChange={onOpenChange}
            onResetStart={onResetStart}
            onResetComplete={onResetComplete}
          />
        </PipelineRequestStatusProvider>,
        { queryClient }
      )
      await screen.findByText(initialStatus === 'started' ? 'Running' : 'Stopped')
      expect(
        screen.getByText(
          initialStatus === 'started'
            ? 'This resets the table, deletes its destination data, and syncs existing rows again. The pipeline restarts automatically to apply the reset.'
            : 'This resets the table, deletes its destination data, and syncs existing rows again.'
        )
      ).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', {
          name: target === 'all' ? 'Reset all tables' : 'Reset table',
        })
      )
      expect(onResetStart).toHaveBeenCalledWith(target === 'all' ? [1] : 1)
      expect(screen.getByText(optimisticLabel)).toBeInTheDocument()
      backendStatus = nextStatus
      await act(async () => {
        await queryClient.invalidateQueries(
          { queryKey: replicationKeys.pipelinesStatus('default', 9) },
          { cancelRefetch: false }
        )
      })
      expect(screen.getByText(optimisticLabel)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Resetting…' })).toBeDisabled()
      await act(async () => {
        complete()
      })
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
      expect(onResetComplete).toHaveBeenCalledWith(target === 'all' ? [1] : 1)
      await waitFor(() => expect(screen.getByText(nextLabel)).toBeInTheDocument())
      expect(requests).toEqual([
        {
          target: target === 'all' ? { type: 'all_tables' } : { type: 'single_table', table_id: 1 },
        },
      ])
    }
  )

  it.each(['all', 'single'] as const)(
    'keeps the $target reset dialog open after an error',
    async (target) => {
      const onOpenChange = vi.fn()
      const onResetStart = vi.fn()
      const onResetComplete = vi.fn()

      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
        response: () =>
          HttpResponse.json<ReplicationPipelineStatusResponse>({
            pipeline_id: 9,
            status: { name: 'started' },
          }),
      })
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/rollback-tables',
        response: () =>
          HttpResponse.json<APIErrorBody>({ message: 'Unable to reset tables' }, { status: 500 }),
      })

      customRender(
        <PipelineRequestStatusProvider>
          <RestartDialogWithStatus
            target={target}
            onOpenChange={onOpenChange}
            onResetStart={onResetStart}
            onResetComplete={onResetComplete}
          />
        </PipelineRequestStatusProvider>
      )

      await screen.findByText('Running')
      fireEvent.click(
        screen.getByRole('button', {
          name: target === 'all' ? 'Reset all tables' : 'Reset table',
        })
      )

      await waitFor(() => {
        expect(onResetComplete).toHaveBeenCalledWith(target === 'all' ? [1] : 1)
      })
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', {
          name: target === 'all' ? 'Reset all tables' : 'Reset table',
        })
      ).toBeEnabled()
    }
  )
})

const RestartDialogWithStatus = ({
  target,
  onOpenChange,
  onResetStart,
  onResetComplete,
}: {
  target: 'single' | 'all'
  onOpenChange: (open: boolean) => void
  onResetStart: (tableIds: number[] | number) => void
  onResetComplete: (tableIds: number[] | number) => void
}) => {
  const { data, error, isPending, isError, isSuccess } = useReplicationPipelineStatusQuery({
    projectRef: 'default',
    pipelineId: 9,
  })
  const { getRequestStatus } = usePipelineRequestStatus()
  const pipelineStatusName = getStatusName(data?.status)
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
      {target === 'all' ? (
        <BatchRestartDialog
          open
          mode="all"
          tables={[table(1, { name: 'following_wal' })]}
          pipelineStatusName={pipelineStatusName}
          onOpenChange={onOpenChange}
          onResetStart={onResetStart}
          onResetComplete={onResetComplete}
        />
      ) : (
        <RestartTableDialog
          open
          table={table(1, { name: 'following_wal' })}
          pipelineStatusName={pipelineStatusName}
          onOpenChange={onOpenChange}
          onResetStart={onResetStart}
          onResetComplete={onResetComplete}
        />
      )}
    </>
  )
}
