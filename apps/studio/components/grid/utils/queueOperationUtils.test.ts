import { describe, test, expect } from 'vitest'
import {
  generateTableChangeKey,
  generateTableChangeKeyFromOperation,
  rowMatchesIdentifiers,
  applyCellEdit,
} from './queueOperationUtils'
import { QueuedOperationType } from '@/state/table-editor-operation-queue.types'

describe('generateTableChangeKey', () => {
  test('should generate key with row identifiers', () => {
    const key = generateTableChangeKey({
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      columnName: 'name',
      rowIdentifiers: { id: 1 },
    })
    expect(key).toBe('edit_cell_content:1:name:id:1')
  })

  test('should generate key with empty row identifiers', () => {
    const key = generateTableChangeKey({
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      columnName: 'name',
      rowIdentifiers: {},
    })
    expect(key).toBe('edit_cell_content:1:name:')
  })

  test('should generate key with multiple row identifiers sorted alphabetically', () => {
    const key = generateTableChangeKey({
      type: QueuedOperationType.EDIT_CELL_CONTENT,
      tableId: 1,
      columnName: 'name',
      rowIdentifiers: { z_id: 3, a_id: 1 },
    })
    expect(key).toBe('edit_cell_content:1:name:a_id:1|z_id:3')
  })
})

describe('generateTableChangeKeyFromOperation', () => {
  test('should generate key from EDIT_CELL_CONTENT operation', () => {
    const operation = {
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
    const key = generateTableChangeKeyFromOperation(operation)
    expect(key).toBe('edit_cell_content:1:name:id:1')
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
    expect(() => generateTableChangeKeyFromOperation(operation)).toThrow('Unknown operation type')
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

describe('applyCellEdit', () => {
  test('should apply cell edit to matching row', () => {
    const rows = [
      { idx: 0, id: 1, name: 'old' },
      { idx: 1, id: 2, name: 'test' },
    ]
    const result = applyCellEdit(rows, 'name', { id: 1 }, 'new')
    expect(result).toEqual([
      { idx: 0, id: 1, name: 'new' },
      { idx: 1, id: 2, name: 'test' },
    ])
  })

  test('should not affect non-matching rows', () => {
    const rows = [
      { idx: 0, id: 1, name: 'old' },
      { idx: 1, id: 2, name: 'test' },
    ]
    const result = applyCellEdit(rows, 'name', { id: 3 }, 'new')
    expect(result).toEqual([
      { idx: 0, id: 1, name: 'old' },
      { idx: 1, id: 2, name: 'test' },
    ])
  })

  test('should create new row instances for matching row', () => {
    const rows = [{ idx: 0, id: 1, name: 'old' }]
    const result = applyCellEdit(rows, 'name', { id: 1 }, 'new')
    expect(result[0]).not.toBe(rows[0])
    expect(result[0]).toEqual({ idx: 0, id: 1, name: 'new' })
  })

  test('should not modify original array', () => {
    const rows = [{ idx: 0, id: 1, name: 'old' }]
    const originalRows = [...rows]
    applyCellEdit(rows, 'name', { id: 1 }, 'new')
    expect(rows).toEqual(originalRows)
  })

  test('should handle multiple matching rows with composite keys', () => {
    const rows = [
      { idx: 0, id: 1, org_id: 10, name: 'old1' },
      { idx: 1, id: 1, org_id: 20, name: 'old2' },
      { idx: 2, id: 2, org_id: 10, name: 'old3' },
    ]
    const result = applyCellEdit(rows, 'name', { id: 1, org_id: 10 }, 'new')
    expect(result).toEqual([
      { idx: 0, id: 1, org_id: 10, name: 'new' },
      { idx: 1, id: 1, org_id: 20, name: 'old2' },
      { idx: 2, id: 2, org_id: 10, name: 'old3' },
    ])
  })

  test('should handle setting value to null', () => {
    const rows = [{ idx: 0, id: 1, name: 'test' }]
    const result = applyCellEdit(rows, 'name', { id: 1 }, null)
    expect(result).toEqual([{ idx: 0, id: 1, name: null }])
  })

  test('should handle setting value to undefined', () => {
    const rows = [{ idx: 0, id: 1, name: 'test' }]
    const result = applyCellEdit(rows, 'name', { id: 1 }, undefined)
    expect(result).toEqual([{ idx: 0, id: 1, name: undefined }])
  })

  test('should handle numeric values', () => {
    const rows = [{ idx: 0, id: 1, count: 0 }]
    const result = applyCellEdit(rows, 'count', { id: 1 }, 42)
    expect(result).toEqual([{ idx: 0, id: 1, count: 42 }])
  })

  test('should handle object values', () => {
    const rows = [{ idx: 0, id: 1, data: null }]
    const newValue = { nested: { value: 123 } }
    const result = applyCellEdit(rows, 'data', { id: 1 }, newValue)
    expect(result).toEqual([{ idx: 0, id: 1, data: newValue }])
  })

  test('should handle empty rows array', () => {
    const rows: any[] = []
    const result = applyCellEdit(rows, 'name', { id: 1 }, 'new')
    expect(result).toEqual([])
  })

  test('should update all matching rows with same identifier', () => {
    const rows = [
      { idx: 0, id: 1, name: 'row1' },
      { idx: 1, id: 1, name: 'row2' },
      { idx: 2, id: 2, name: 'row3' },
    ]
    const result = applyCellEdit(rows, 'name', { id: 1 }, 'updated')
    expect(result).toEqual([
      { idx: 0, id: 1, name: 'updated' },
      { idx: 1, id: 1, name: 'updated' },
      { idx: 2, id: 2, name: 'row3' },
    ])
  })
})
