import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTableEditorState } from './table-editor'
import {
  NewEditCellContentOperation,
  NewQueuedOperation,
  QueuedOperationType,
} from './table-editor-operation-queue.types'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { Entity } from '@/data/table-editor/table-editor-types'

const usersTable = { id: 1, name: 'users', schema: 'public' } as Entity

function editCellOperation(
  columnName: string,
  newValue: unknown,
  rowIdentifiers: Record<string, unknown> = { id: 1 }
): NewEditCellContentOperation {
  return {
    tableId: 1,
    type: QueuedOperationType.EDIT_CELL_CONTENT,
    payload: {
      rowIdentifiers,
      columnName,
      oldValue: 'Original',
      newValue,
      table: usersTable,
      enumArrayColumns: [],
    },
  }
}

describe('table editor operation queue — save success handling', () => {
  let now: number

  beforeEach(() => {
    now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps an operation queued while a save was in flight', () => {
    const state = createTableEditorState()

    state.queueOperation(editCellOperation('name', 'Before save'))
    expect(state.startQueueSave()).toHaveLength(1)

    // The grid stays editable during a save, so this edit is queued mid-flight
    now += 1_000
    state.queueOperation(editCellOperation('name', 'During save', { id: 2 }))
    expect(state.operationQueue.operations).toHaveLength(2)

    state.finishQueueSave(true)

    expect(state.operationQueue.operations).toHaveLength(1)
    expect(state.operationQueue.operations[0].payload).toMatchObject({ newValue: 'During save' })
    // Unsaved leftovers must be saveable again, not stuck in 'saving'
    expect(state.operationQueue.status).toBe('pending')
  })

  it('keeps a re-edit of the same cell queued even when the timestamps match', () => {
    const state = createTableEditorState()

    state.queueOperation(editCellOperation('name', 'Before save'))
    const savedOperations = state.startQueueSave()!
    state.queueOperation(editCellOperation('name', 'Re-edited during save'))

    // Two versions can share both the operation ID and timestamp.
    expect(state.operationQueue.operations).toHaveLength(1)
    expect(state.operationQueue.operations[0].id).toBe(savedOperations[0].id)
    expect(state.operationQueue.operations[0].timestamp).toBe(savedOperations[0].timestamp)

    state.finishQueueSave(true)

    expect(state.operationQueue.operations).toHaveLength(1)
    expect(state.operationQueue.operations[0].payload).toMatchObject({
      oldValue: 'Before save',
      newValue: 'Re-edited during save',
    })
    expect(state.operationQueue.status).toBe('pending')
  })

  it('empties the queue and returns to idle when everything queued was saved', () => {
    const state = createTableEditorState()

    state.queueOperation(editCellOperation('name', 'Only edit'))
    state.startQueueSave()
    state.finishQueueSave(true)

    expect(state.operationQueue.operations).toHaveLength(0)
    expect(state.operationQueue.status).toBe('idle')
  })

  it.each([true, false])('handles a revert during a save (success: %s)', (isSuccess) => {
    const state = createTableEditorState()
    state.queueOperation(editCellOperation('name', 'First edit'))
    state.startQueueSave()

    state.queueOperation(editCellOperation('name', 'Original'))
    state.finishQueueSave(isSuccess)

    if (isSuccess) {
      expect(state.operationQueue.operations).toMatchObject([
        { payload: { oldValue: 'First edit', newValue: 'Original' } },
      ])
      expect(state.operationQueue.status).toBe('pending')
    } else {
      expect(state.operationQueue.operations).toHaveLength(0)
      expect(state.operationQueue.status).toBe('idle')
    }
  })

  it('keeps a change from zero to SQL null after the zero is saved', () => {
    const state = createTableEditorState()
    const edit = editCellOperation('score', 0)
    state.queueOperation({ ...edit, payload: { ...edit.payload, oldValue: null } })
    state.startQueueSave()

    state.queueOperation(editCellOperation('score', null))
    state.finishQueueSave(true)

    expect(state.operationQueue.operations).toMatchObject([
      { payload: { oldValue: 0, newValue: null } },
    ])
    expect(state.operationQueue.status).toBe('pending')
  })

  it('keeps the original batch and later edits available after a failed save', () => {
    const state = createTableEditorState()
    state.queueOperation(editCellOperation('name', 'First edit'))
    state.startQueueSave()
    expect(state.startQueueSave()).toBeUndefined()
    expect(state.clearQueue()).toBe(false)

    state.queueOperation(editCellOperation('name', 'Later edit', { id: 2 }))
    state.finishQueueSave(false)

    expect(state.operationQueue.operations).toMatchObject([
      { payload: { newValue: 'First edit' } },
      { payload: { newValue: 'Later edit' } },
    ])
    expect(state.operationQueue.status).toBe('pending')
  })

  it('blocks changes to a row until its insert settles', () => {
    const state = createTableEditorState()
    const row = { idx: -1, __tempId: '-1', name: 'New user' }
    const insert: NewQueuedOperation = {
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      payload: { tempId: row.__tempId, rowData: row, table: usersTable },
    }
    const edit = editCellOperation('name', 'Updated', { __tempId: row.__tempId })
    const remove: NewQueuedOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: { rowIdentifiers: { __tempId: row.__tempId }, originalRow: row, table: usersTable },
    }

    state.queueOperation(insert)
    state.startQueueSave()
    expect(state.queueOperation(edit)).toBe(false)
    expect(state.queueOperation(remove)).toBe(false)
    expect(state.operationQueue.operations).toMatchObject([insert])

    state.finishQueueSave(false)
    state.queueOperation(edit)
    expect(state.operationQueue.operations[0].payload).toMatchObject({
      rowData: { name: 'Updated' },
    })
    state.startQueueSave()
    state.finishQueueSave(true)

    expect(state.queueOperation(edit)).toBe(false)
    expect(state.queueOperation(remove)).toBe(false)
    expect(state.operationQueue.operations).toHaveLength(0)
  })

  it.each([42, 'user-42'])('allows a real primary key named __tempId (%s)', (id) => {
    const state = createTableEditorState()
    const edit = editCellOperation('name', 'Updated', { __tempId: id })
    const table = {
      ...usersTable,
      entity_type: ENTITY_TYPE.TABLE,
      primary_keys: [{ name: '__tempId' }],
    } as Entity

    state.queueOperation({ ...edit, payload: { ...edit.payload, table } })

    expect(state.operationQueue.operations).toMatchObject([
      { payload: { rowIdentifiers: { __tempId: id }, newValue: 'Updated' } },
    ])
  })

  it('blocks changes using an in-flight primary key until the row is refreshed', () => {
    const state = createTableEditorState()
    state.queueOperation(editCellOperation('id', 2))
    state.startQueueSave()

    expect(state.queueOperation(editCellOperation('name', 'Updated'))).toBe(false)
    state.finishQueueSave(true)

    state.queueOperation(editCellOperation('name', 'Updated', { id: 2 }))
    expect(state.operationQueue.operations).toMatchObject([
      { payload: { rowIdentifiers: { id: 2 }, newValue: 'Updated' } },
    ])
  })
})
