import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useOperationQueueActions } from './useOperationQueueActions'
import { projectKeys } from '@/data/projects/keys'
import type { Entity } from '@/data/table-editor/table-editor-types'
import { createTableEditorState, TableEditorStateContext } from '@/state/table-editor'
import { QueuedOperationType } from '@/state/table-editor-operation-queue.types'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const table = { id: 1, name: 'users', schema: 'public' } as Entity

function queueEdit(state: ReturnType<typeof createTableEditorState>, id: number, newValue: string) {
  state.queueOperation({
    tableId: table.id,
    type: QueuedOperationType.EDIT_CELL_CONTENT,
    payload: {
      rowIdentifiers: { id },
      columnName: 'name',
      oldValue: 'Original',
      newValue,
      table,
    },
  })
}

describe('useOperationQueueActions', () => {
  it('keeps edits made while a save is in flight queued for the next save', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(projectKeys.detail('default'), {
      ref: 'default',
      status: 'ACTIVE_HEALTHY',
      connectionString: 'postgresql://postgres@localhost:5432/postgres',
    })
    const queries: string[] = []
    const respond = Promise.withResolvers<void>()
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        queries.push(query)
        await respond.promise
        return HttpResponse.json<unknown[]>([])
      },
    })

    const state = createTableEditorState()
    queueEdit(state, 1, 'First save')
    const { result } = renderHook(() => useOperationQueueActions(), {
      wrapper: ({ children }) => (
        <CustomWrapper queryClient={queryClient}>
          <TableEditorStateContext.Provider value={state}>
            {children}
          </TableEditorStateContext.Provider>
        </CustomWrapper>
      ),
    })

    act(() => {
      result.current.handleSave()
      result.current.handleSave()
    })
    try {
      await waitFor(() => expect(queries).toHaveLength(1))
      act(() => queueEdit(state, 2, 'Next save'))
    } finally {
      respond.resolve()
    }

    await waitFor(() => expect(result.current.isSaving).toBe(false))
    expect(state.operationQueue.status).toBe('pending')
    expect(state.operationQueue.operations).toMatchObject([
      { payload: { rowIdentifiers: { id: 2 }, newValue: 'Next save' } },
    ])
    expect(queries).toHaveLength(1)
    expect(queries[0]).toContain('First save')
    expect(queries[0]).not.toContain('Next save')

    act(() => result.current.handleSave())
    await waitFor(() => expect(state.operationQueue.status).toBe('idle'))
    expect(queries).toHaveLength(2)
    expect(queries[1]).toContain('Next save')
    expect(queries[1]).not.toContain('First save')
    expect(state.operationQueue.operations).toHaveLength(0)
  })
})
