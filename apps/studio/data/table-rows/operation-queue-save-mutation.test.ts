import { describe, expect, it } from 'vitest'

import { getOperationSqlStatements } from './operation-queue-save-mutation'
import type { Entity } from '@/data/table-editor/table-editor-types'
import { QueuedOperation, QueuedOperationType } from '@/state/table-editor-operation-queue.types'

const usersTable = { id: 1, name: 'users', schema: 'public' } as Entity

function createEditOperation(
  columnName: string,
  newValue: unknown,
  rowIdentifiers: Record<string, unknown> = { id: 1 }
): QueuedOperation {
  return {
    id: `${columnName}-${String(newValue)}`,
    tableId: 1,
    timestamp: 1,
    type: QueuedOperationType.EDIT_CELL_CONTENT,
    payload: {
      rowIdentifiers,
      columnName,
      oldValue: undefined,
      newValue,
      table: usersTable,
      enumArrayColumns: [],
    },
  }
}

describe('getOperationSqlStatements', () => {
  it('merges edits for the same row into one update statement', () => {
    const statements = getOperationSqlStatements([
      createEditOperation('id', '4'),
      createEditOperation('name', 'Ram 1'),
    ])

    expect(statements).toHaveLength(1)

    const sql = String(statements[0])
    expect(sql).toContain('update public.users set (id,name)')
    expect(sql).toContain('"id":"4"')
    expect(sql).toContain('"name":"Ram 1"')
    expect(sql.match(/where id = 1/g)).toHaveLength(1)
  })

  it('keeps edits for different rows as separate update statements', () => {
    const statements = getOperationSqlStatements([
      createEditOperation('name', 'Ram 1', { id: 1 }),
      createEditOperation('name', 'Shyam 1', { id: 2 }),
    ])

    expect(statements).toHaveLength(2)
    expect(String(statements[0])).toContain('where id = 1')
    expect(String(statements[1])).toContain('where id = 2')
  })

  it('does not merge rows whose identifier values would collide with delimiter keys', () => {
    const statements = getOperationSqlStatements([
      createEditOperation('name', 'Row 1', { a: 'x', b: 'y|b:z' }),
      createEditOperation('name', 'Row 2', { a: 'x|b:y', b: 'z' }),
    ])

    expect(statements).toHaveLength(2)
  })
})
