import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BatchRestartDialog } from './BatchRestartDialog'
import type { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'

const mocks = vi.hoisted(() => ({
  rollbackTables: vi.fn().mockResolvedValue({ pipeline_id: 9, tables: [] }),
}))

vi.mock('common', () => ({
  useParams: () => ({ ref: 'project-ref', pipelineId: '9' }),
}))
vi.mock('@/data/replication/rollback-tables-mutation', () => ({
  useRollbackTablesMutation: () => ({
    mutateAsync: mocks.rollbackTables,
    isPending: false,
  }),
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

    render(
      <BatchRestartDialog
        open
        onOpenChange={vi.fn()}
        mode="errored"
        tables={tables}
        tableSyncCopy={{ type: 'include_tables', table_ids: [1, 2] }}
        onRestartStart={onRestartStart}
      />
    )

    expect(screen.getByText(/3 currently failed tables/)).toBeInTheDocument()
    expect(screen.getByTestId('copy-targets')).toHaveTextContent('public.table_1,public.table_2')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Restart failed tables' }))
    })

    expect(onRestartStart).toHaveBeenCalledWith([1, 2, 3])
    expect(mocks.rollbackTables).toHaveBeenCalledWith(
      expect.objectContaining({
        pipelineId: 9,
        target: { type: 'all_errored_tables' },
        rollbackType: 'full',
      })
    )
  })
})
