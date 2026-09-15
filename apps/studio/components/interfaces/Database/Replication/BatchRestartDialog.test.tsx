import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { BatchRestartDialog } from './BatchRestartDialog'
import { RestartTableDialog } from './RestartTableDialog'
import type { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

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
    const onRestartStart = vi.fn()
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
      <BatchRestartDialog
        open
        onOpenChange={onOpenChange}
        mode="errored"
        tables={tables}
        tableSyncCopy={{ type: 'include_tables', table_ids: [1, 2] }}
        onRestartStart={onRestartStart}
      />
    )

    expect(screen.getByText(/This resets 3 failed tables/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /2 of 3 tables will sync existing rows again. The remaining 1 table will skip initial sync/
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId('copy-targets')).toHaveTextContent('public.table_1,public.table_2')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reset failed tables' }))
    })

    expect(onRestartStart).toHaveBeenCalledWith([1, 2, 3])
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(requests).toEqual([{ target: { type: 'all_errored_tables' } }])
  })

  it.each(['all', 'single'] as const)('sends only the %s reset target', async (target) => {
    const onOpenChange = vi.fn()
    const requests: unknown[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/rollback-tables',
      response: async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json<components['schemas']['RollbackTablesResponse_Output']>({
          pipeline_id: 9,
          tables: [{ table_id: 1, new_state: { name: 'queued' } }],
        })
      },
    })
    customRender(
      target === 'all' ? (
        <BatchRestartDialog
          open
          mode="all"
          tables={[table(1, { name: 'following_wal' })]}
          onOpenChange={onOpenChange}
        />
      ) : (
        <RestartTableDialog
          open
          table={table(1, { name: 'following_wal' })}
          onOpenChange={onOpenChange}
        />
      )
    )
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(requests).toEqual([
      { target: target === 'all' ? { type: 'all_tables' } : { type: 'single_table', table_id: 1 } },
    ])
  })
})
