import { describe, expect, test } from 'vitest'

import {
  operationMatchesRow,
  resolveDeleteRowConflicts,
  resolveEditCellConflicts,
  upsertOperation,
} from './queueConflictResolution'
import {
  type NewAddRowOperation,
  type NewDeleteRowOperation,
  type NewEditCellContentOperation,
  QueuedOperation,
  QueuedOperationType,
} from '@/state/table-editor-operation-queue.types'

describe('operationMatchesRow', () => {
  const mockTable = {} as any

  test('should match EDIT_CELL_CONTENT operation with same row identifiers', () => {
    const operation: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: mockTable,
      },
    }
    expect(operationMatchesRow(operation, 1, { id: 1 })).toBe(true)
  })

  test('should not match EDIT_CELL_CONTENT operation with different row identifiers', () => {
    const operation: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: mockTable,
      },
    }
    expect(operationMatchesRow(operation, 1, { id: 2 })).toBe(false)
  })

  test('should not match operation from different table', () => {
    const operation: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: mockTable,
      },
    }
    expect(operationMatchesRow(operation, 2, { id: 1 })).toBe(false)
  })

  test('should match DELETE_ROW operation with same row identifiers', () => {
    const operation: QueuedOperation = {
      id: 'delete_row:1:id:1',
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 1, id: 1, name: 'test' },
        table: mockTable,
      },
    }
    expect(operationMatchesRow(operation, 1, { id: 1 })).toBe(true)
  })

  test('should return false for ADD_ROW operations', () => {
    const operation: QueuedOperation = {
      id: 'add_row:1:temp123',
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        tempId: 'temp123',
        rowData: { idx: 1, __tempId: '1', name: 'new' },
        table: mockTable,
      },
    }
    expect(operationMatchesRow(operation, 1, { id: 1 })).toBe(false)
  })
})

describe('resolveDeleteRowConflicts', () => {
  const mockTable = {} as any

  test('should skip delete and remove ADD_ROW when deleting a newly added row', () => {
    const addRowOp: QueuedOperation = {
      id: 'add_row:1:-12345',
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        tempId: '-12345',
        rowData: { idx: -12345, __tempId: '-12345', name: 'new row' },
        table: mockTable,
      },
    }

    const operations = [addRowOp]
    const deleteOperation: NewDeleteRowOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: {
        rowIdentifiers: { __tempId: '-12345' },
        originalRow: { idx: -12345, __tempId: '-12345', name: 'new row' },
        table: mockTable,
      },
    }

    const result = resolveDeleteRowConflicts(operations, deleteOperation)

    expect(result.action).toBe('skip')
    expect(result.filteredOperations).toEqual([])
  })

  test('should skip delete and remove ADD_ROW and related EDIT_CELLs when deleting a newly added row', () => {
    const addRowOp: QueuedOperation = {
      id: 'add_row:1:-12345',
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        tempId: '-12345',
        rowData: { idx: -12345, __tempId: '-12345', name: 'new row' },
        table: mockTable,
      },
    }

    const editCellOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:__tempId:-12345',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { __tempId: '-12345' },
        columnName: 'name',
        oldValue: 'new row',
        newValue: 'edited',
        table: mockTable,
      },
    }

    const otherEditOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:99',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 99 },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const operations = [addRowOp, editCellOp, otherEditOp]
    const deleteOperation: NewDeleteRowOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: {
        rowIdentifiers: { __tempId: '-12345' },
        originalRow: { idx: -12345, __tempId: '-12345', name: 'new row' },
        table: mockTable,
      },
    }

    const result = resolveDeleteRowConflicts(operations, deleteOperation)

    expect(result.action).toBe('skip')
    expect(result.filteredOperations).toHaveLength(1)
    expect(result.filteredOperations[0]).toEqual(otherEditOp)
  })

  test('should add delete and remove EDIT_CELLs for existing row being deleted', () => {
    const editCellOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'edited',
        table: mockTable,
      },
    }

    const otherEditOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:2',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 2 },
        columnName: 'name',
        oldValue: 'other',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const operations = [editCellOp, otherEditOp]
    const deleteOperation: NewDeleteRowOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 1, id: 1, name: 'original' },
        table: mockTable,
      },
    }

    const result = resolveDeleteRowConflicts(operations, deleteOperation)

    expect(result.action).toBe('add')
    expect(result.filteredOperations).toHaveLength(1)
    expect(result.filteredOperations[0]).toEqual(otherEditOp)
  })

  test('should add delete with no changes when there are no conflicts', () => {
    const otherEditOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:2',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 2 },
        columnName: 'name',
        oldValue: 'other',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const operations = [otherEditOp]
    const deleteOperation: NewDeleteRowOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 1, id: 1, name: 'original' },
        table: mockTable,
      },
    }

    const result = resolveDeleteRowConflicts(operations, deleteOperation)

    expect(result.action).toBe('add')
    expect(result.filteredOperations).toEqual(operations)
  })
})

describe('resolveEditCellConflicts', () => {
  const mockTable = {} as any

  test('should reject edit on a row pending deletion', () => {
    const deleteOp: QueuedOperation = {
      id: 'delete_row:1:id:1',
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 1, id: 1, name: 'to delete' },
        table: mockTable,
      },
    }

    const operations = [deleteOp]
    const editOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'to delete',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const result = resolveEditCellConflicts(operations, editOperation)

    expect(result.action).toBe('reject')
    if (result.action === 'reject') {
      expect(result.reason).toContain('pending deletion')
    }
  })

  test('should merge edit into ADD_ROW for a newly added row', () => {
    const addRowOp: QueuedOperation = {
      id: 'add_row:1:-12345',
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        tempId: '-12345',
        rowData: { idx: -12345, __tempId: '-12345', name: 'new row' },
        table: mockTable,
      },
    }

    const operations = [addRowOp]
    const editOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { __tempId: '-12345' },
        columnName: 'name',
        oldValue: 'new row',
        newValue: 'edited value',
        table: mockTable,
      },
    }

    const result = resolveEditCellConflicts(operations, editOperation)

    expect(result.action).toBe('merge')
    if (result.action === 'merge') {
      expect(result.updatedOperations).toHaveLength(1)
      const updatedAddRow = result.updatedOperations[0]
      expect(updatedAddRow.type).toBe(QueuedOperationType.ADD_ROW)
      expect((updatedAddRow.payload as any).rowData.name).toBe('edited value')
    }
  })

  test('should return add action for normal edit on existing row', () => {
    const otherOp: QueuedOperation = {
      id: 'edit_cell_content:1:email:id:2',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 2 },
        columnName: 'email',
        oldValue: 'old@test.com',
        newValue: 'new@test.com',
        table: mockTable,
      },
    }

    const operations = [otherOp]
    const editOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const result = resolveEditCellConflicts(operations, editOperation)

    expect(result.action).toBe('add')
  })

  test('should return add when editing tempId row but ADD_ROW not found', () => {
    const operations: QueuedOperation[] = []
    const editOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { __tempId: '-99999' },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const result = resolveEditCellConflicts(operations, editOperation)

    expect(result.action).toBe('add')
  })
})

describe('upsertOperation', () => {
  const mockTable = {} as any

  test('should add new operation to empty queue', () => {
    const operations: QueuedOperation[] = []
    const newOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const result = upsertOperation(operations, newOperation)

    expect(result.operations).toHaveLength(1)
    expect(result.operations[0].type).toBe(QueuedOperationType.EDIT_CELL_CONTENT)
    expect(result.operations[0].id).toBe('edit_cell_content:1:name:id:1')
  })

  test('should add new operation to existing queue', () => {
    const existingOp: QueuedOperation = {
      id: 'edit_cell_content:1:email:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'email',
        oldValue: 'old@test.com',
        newValue: 'new@test.com',
        table: mockTable,
      },
    }

    const operations = [existingOp]
    const newOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const result = upsertOperation(operations, newOperation)

    expect(result.operations).toHaveLength(2)
  })

  test('should update existing EDIT_CELL operation and preserve original oldValue', () => {
    const existingOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now() - 1000,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'very first value',
        newValue: 'intermediate',
        table: mockTable,
      },
    }

    const operations = [existingOp]
    const newOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'intermediate',
        newValue: 'final value',
        table: mockTable,
      },
    }

    const result = upsertOperation(operations, newOperation)

    expect(result.operations).toHaveLength(1)
    const updated = result.operations[0]
    expect((updated.payload as any).oldValue).toBe('very first value')
    expect((updated.payload as any).newValue).toBe('final value')
  })

  test('should update existing DELETE_ROW operation', () => {
    const existingOp: QueuedOperation = {
      id: 'delete_row:1:id:1',
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      timestamp: Date.now() - 1000,
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 1, id: 1, name: 'old data' },
        table: mockTable,
      },
    }

    const operations = [existingOp]
    const newOperation: NewDeleteRowOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 1, id: 1, name: 'updated data' },
        table: mockTable,
      },
    }

    const result = upsertOperation(operations, newOperation)

    expect(result.operations).toHaveLength(1)
    expect((result.operations[0].payload as any).originalRow.name).toBe('updated data')
  })

  test('should not mutate original operations array', () => {
    const existingOp: QueuedOperation = {
      id: 'edit_cell_content:1:name:id:1',
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      timestamp: Date.now(),
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'original',
        newValue: 'changed',
        table: mockTable,
      },
    }

    const operations = [existingOp]
    const originalOperations = [...operations]
    const newOperation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 2 },
        columnName: 'name',
        oldValue: 'original2',
        newValue: 'changed2',
        table: mockTable,
      },
    }

    upsertOperation(operations, newOperation)

    expect(operations).toEqual(originalOperations)
  })

  test('should handle ADD_ROW operation', () => {
    const operations: QueuedOperation[] = []
    const newOperation: NewAddRowOperation = {
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      payload: {
        tempId: '-12345',
        rowData: { idx: -12345, __tempId: '-12345', name: 'new row' },
        table: mockTable,
      },
    }

    const result = upsertOperation(operations, newOperation)

    expect(result.operations).toHaveLength(1)
    expect(result.operations[0].id).toBe('add_row:1:-12345')
  })
})
