import { describe, expect, test } from 'vitest'

import type { SupaRow } from '../types'
import {
  formatGridDataWithOperationValues,
  generateTableChangeKey,
  rowMatchesIdentifiers,
} from './queueOperationUtils'
import {
  QueuedOperationType,
  type NewAddRowOperation,
  type NewDeleteRowOperation,
  type NewEditCellContentOperation,
  type QueuedOperation,
} from '@/state/table-editor-operation-queue.types'

describe('generateTableChangeKey', () => {
  test('should generate key for EDIT_CELL_CONTENT with row identifiers', () => {
    const operation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: {} as any,
      },
    }
    const key = generateTableChangeKey(operation)
    expect(key).toBe('edit_cell_content:1:name:id:1')
  })

  test('should generate key for EDIT_CELL_CONTENT with empty row identifiers', () => {
    const operation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: {},
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: {} as any,
      },
    }
    const key = generateTableChangeKey(operation)
    expect(key).toBe('edit_cell_content:1:name:')
  })

  test('should generate key with multiple row identifiers sorted alphabetically', () => {
    const operation: NewEditCellContentOperation = {
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      payload: {
        rowIdentifiers: { z_id: 3, a_id: 1 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: {} as any,
      },
    }
    const key = generateTableChangeKey(operation)
    expect(key).toBe('edit_cell_content:1:name:a_id:1|z_id:3')
  })

  test('should generate key for ADD_ROW operation', () => {
    const operation: NewAddRowOperation = {
      type: QueuedOperationType.ADD_ROW,
      tableId: 1,
      payload: {
        tempId: 'temp-123',
        rowData: { idx: -1, __tempId: 'temp-123' },
        table: {} as any,
      },
    }
    const key = generateTableChangeKey(operation)
    expect(key).toBe('add_row:1:temp-123')
  })

  test('should generate key for DELETE_ROW operation', () => {
    const operation: NewDeleteRowOperation = {
      type: QueuedOperationType.DELETE_ROW,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        originalRow: { idx: 0, id: 1 },
        table: {} as any,
      },
    }
    const key = generateTableChangeKey(operation)
    expect(key).toBe('delete_row:1:id:1')
  })

  test('should throw error for unknown operation type', () => {
    const operation = {
      type: 'unknown' as any,
      tableId: 1,
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: {} as any,
      },
    }
    expect(() => generateTableChangeKey(operation)).toThrow('Unknown operation type')
  })
})

describe('rowMatchesIdentifiers', () => {
  test('should return false for empty row identifiers', () => {
    const result = rowMatchesIdentifiers({ id: 1 }, {})
    expect(result).toBe(false)
  })

  test('should match row with single identifier', () => {
    const result = rowMatchesIdentifiers({ id: 1 }, { id: 1 })
    expect(result).toBe(true)
  })

  test('should match row with multiple identifiers', () => {
    const result = rowMatchesIdentifiers(
      { id: 1, email: 'test@test.com' },
      { id: 1, email: 'test@test.com' }
    )
    expect(result).toBe(true)
  })

  test('should not match row with different values', () => {
    const result = rowMatchesIdentifiers({ id: 2 }, { id: 1 })
    expect(result).toBe(false)
  })

  test('should not match row with missing identifier keys', () => {
    const result = rowMatchesIdentifiers({ id: 1 }, { id: 1, email: 'test@test.com' })
    expect(result).toBe(false)
  })

  test('should match row with extra keys', () => {
    const result = rowMatchesIdentifiers({ id: 1, name: 'John', age: 30 }, { id: 1 })
    expect(result).toBe(true)
  })

  test('should match with null values', () => {
    const result = rowMatchesIdentifiers({ id: null }, { id: null })
    expect(result).toBe(true)
  })

  test('should not match with undefined values in row', () => {
    const result = rowMatchesIdentifiers({ id: undefined, name: 'test' }, { id: 1 })
    expect(result).toBe(false)
  })
})

describe('formatGridDataWithOperationValues', () => {
  const makeRow = (idx: number, data: Record<string, unknown> = {}): SupaRow => ({
    idx,
    ...data,
  })

  const makeEditOp = (
    overrides: Partial<QueuedOperation & { payload: any }> = {}
  ): QueuedOperation => ({
    id: 'op-1',
    tableId: 1,
    timestamp: Date.now(),
    type: QueuedOperationType.EDIT_CELL_CONTENT,
    payload: {
      rowIdentifiers: { id: 1 },
      columnName: 'name',
      oldValue: 'old',
      newValue: 'new',
      table: {} as any,
    },
    ...overrides,
  })

  const makeDeleteOp = (
    rowIdentifiers: Record<string, unknown>,
    originalRow: SupaRow
  ): QueuedOperation => ({
    id: 'op-del',
    tableId: 1,
    timestamp: Date.now(),
    type: QueuedOperationType.DELETE_ROW,
    payload: { rowIdentifiers, originalRow, table: {} as any },
  })

  const makeAddOp = (tempId: string, rowData: Record<string, unknown> = {}): QueuedOperation => ({
    id: 'op-add',
    tableId: 1,
    timestamp: Date.now(),
    type: QueuedOperationType.ADD_ROW,
    payload: {
      tempId,
      rowData: { idx: Number(tempId), __tempId: tempId, ...rowData },
      table: {} as any,
    },
  })

  test('should return rows unchanged when there are no operations', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' }), makeRow(1, { id: 2, name: 'Bob' })]
    const result = formatGridDataWithOperationValues({ operations: [], rows })
    expect(result).toEqual(rows)
  })

  test('should apply EDIT_CELL_CONTENT to matching row', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' }), makeRow(1, { id: 2, name: 'Bob' })]
    const op = makeEditOp({
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result[0]).toEqual({ idx: 0, id: 1, name: 'Updated' })
    expect(result[1]).toEqual(rows[1])
  })

  test('should not modify rows when EDIT_CELL_CONTENT does not match any row', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' })]
    const op = makeEditOp({
      payload: {
        rowIdentifiers: { id: 999 },
        columnName: 'name',
        oldValue: 'old',
        newValue: 'new',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result).toEqual(rows)
  })

  test('should apply multiple EDIT_CELL_CONTENT operations to different rows', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' }), makeRow(1, { id: 2, name: 'Bob' })]
    const op1 = makeEditOp({
      id: 'op-1',
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated Alice',
        table: {} as any,
      },
    })
    const op2 = makeEditOp({
      id: 'op-2',
      payload: {
        rowIdentifiers: { id: 2 },
        columnName: 'name',
        oldValue: 'Bob',
        newValue: 'Updated Bob',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({ operations: [op1, op2], rows })
    expect(result[0].name).toBe('Updated Alice')
    expect(result[1].name).toBe('Updated Bob')
  })

  test('multiple operations targeting the same row preserve all column changes', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice', email: 'alice@test.com' })]
    const op1 = makeEditOp({
      id: 'op-1',
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated',
        table: {} as any,
      },
    })
    const op2 = makeEditOp({
      id: 'op-2',
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'email',
        oldValue: 'alice@test.com',
        newValue: 'updated@test.com',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({ operations: [op1, op2], rows })
    // Both column edits should be preserved
    expect(result[0].name).toBe('Updated')
    expect(result[0].email).toBe('updated@test.com')
  })

  test('should mark matching row as deleted for DELETE_ROW operation', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' }), makeRow(1, { id: 2, name: 'Bob' })]
    const op = makeDeleteOp({ id: 1 }, rows[0])

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result[0].__isDeleted).toBe(true)
    expect(result[1].__isDeleted).toBeUndefined()
  })

  test('should not modify rows when DELETE_ROW does not match any row', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' })]
    const op = makeDeleteOp({ id: 999 }, makeRow(0, { id: 999 }))

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result[0].__isDeleted).toBeUndefined()
  })

  test('should not mutate the original rows array', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' })]
    const op = makeEditOp({
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(rows[0].name).toBe('Alice')
    expect(result[0].name).toBe('Updated')
  })

  test('should handle mixed operation types', () => {
    const rows = [
      makeRow(0, { id: 1, name: 'Alice' }),
      makeRow(1, { id: 2, name: 'Bob' }),
      makeRow(2, { id: 3, name: 'Charlie' }),
    ]

    const editOp = makeEditOp({
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated Alice',
        table: {} as any,
      },
    })
    const deleteOp = makeDeleteOp({ id: 2 }, rows[1])

    const result = formatGridDataWithOperationValues({
      operations: [editOp, deleteOp],
      rows,
    })

    expect(result[0].name).toBe('Updated Alice')
    expect(result[1].__isDeleted).toBe(true)
    expect(result[2]).toEqual(rows[2])
  })

  test('should prepend new row for ADD_ROW operation', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' })]
    const op = makeAddOp('-100', { name: 'New Row' })

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ __tempId: '-100', name: 'New Row' })
    expect(result[1]).toEqual(rows[0])
  })

  test('should update existing pending row for ADD_ROW with same tempId', () => {
    const rows: SupaRow[] = [
      { idx: -100, __tempId: '-100', name: 'Original' } as any,
      makeRow(1, { id: 1, name: 'Alice' }),
    ]
    const op = makeAddOp('-100', { name: 'Updated' })

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ __tempId: '-100', name: 'Updated' })
  })

  test('should handle multiple ADD_ROW operations', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' })]
    const op1 = makeAddOp('-100', { name: 'Row 1' })
    const op2 = makeAddOp('-200', { name: 'Row 2' })

    const result = formatGridDataWithOperationValues({ operations: [op1, op2], rows })
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ __tempId: '-200', name: 'Row 2' })
    expect(result[1]).toMatchObject({ __tempId: '-100', name: 'Row 1' })
  })

  test('should correctly delete a row after adding a new row (ADD then DELETE)', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' }), makeRow(1, { id: 2, name: 'Bob' })]
    const addOp = makeAddOp('-100', { name: 'New Row' })
    const deleteOp = makeDeleteOp({ id: 1 }, rows[0])

    const result = formatGridDataWithOperationValues({
      operations: [addOp, deleteOp],
      rows,
    })

    expect(result).toHaveLength(3)
    // New row should be preserved at position 0
    expect(result[0]).toMatchObject({ __tempId: '-100', name: 'New Row' })
    expect(result[0].__isDeleted).toBeUndefined()
    // Deleted row should be marked
    expect(result[1].__isDeleted).toBe(true)
    expect(result[1].id).toBe(1)
    // Other row unaffected
    expect(result[2]).toEqual(rows[1])
  })

  test('should correctly edit a row after adding a new row (ADD then EDIT)', () => {
    const rows = [makeRow(0, { id: 1, name: 'Alice' })]
    const addOp = makeAddOp('-100', { name: 'New Row' })
    const editOp = makeEditOp({
      payload: {
        rowIdentifiers: { id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated Alice',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({
      operations: [addOp, editOp],
      rows,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ __tempId: '-100', name: 'New Row' })
    expect(result[1].name).toBe('Updated Alice')
  })

  test('should handle EDIT_CELL_CONTENT with composite primary keys', () => {
    const rows = [makeRow(0, { tenant_id: 'a', user_id: 1, name: 'Alice' })]
    const op = makeEditOp({
      payload: {
        rowIdentifiers: { tenant_id: 'a', user_id: 1 },
        columnName: 'name',
        oldValue: 'Alice',
        newValue: 'Updated',
        table: {} as any,
      },
    })

    const result = formatGridDataWithOperationValues({ operations: [op], rows })
    expect(result[0].name).toBe('Updated')
  })
})
