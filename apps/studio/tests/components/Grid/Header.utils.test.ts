import { describe, expect, test } from 'vitest'

import {
  formatRowsForCopy,
  hasTruncatedCellValues,
} from '@/components/grid/components/header/Header.utils'
import type { SupaTable } from '@/components/grid/types'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

const usersTable: SupaTable = {
  id: 1,
  name: 'users',
  schema: 'public',
  type: ENTITY_TYPE.TABLE,
  estimateRowCount: 0,
  primaryKey: ['id'],
  columns: [
    { name: 'id', dataType: 'bigint', format: 'int8', position: 1 },
    { name: 'name', dataType: 'text', format: 'text', position: 2 },
  ],
}

const aliceAndBob = [
  { idx: 0, id: 1, name: 'Alice' },
  { idx: 1, id: 2, name: 'Bob' },
]

describe('Header.utils: hasTruncatedCellValues', () => {
  test('returns false for an empty array', () => {
    expect(hasTruncatedCellValues([])).toBe(false)
  })

  test('returns false when no string cell looks truncated', () => {
    expect(hasTruncatedCellValues(aliceAndBob)).toBe(false)
  })

  test('detects the JSON-array truncation marker', () => {
    // Server marks truncated json arrays by appending {"truncated":true} as the last element.
    const rows = [{ idx: 0, id: 1, tags: '[1,2,3,{"truncated":true}]' }]
    expect(hasTruncatedCellValues(rows)).toBe(true)
  })

  test('detects multi-dimensional array values as possibly truncated', () => {
    const rows = [{ idx: 0, id: 1, matrix: '[["a"],["b"]]' }]
    expect(hasTruncatedCellValues(rows)).toBe(true)
  })

  test('flags the whole batch when any single row has a truncated cell', () => {
    const rows = [
      { idx: 0, id: 1, name: 'Alice' },
      { idx: 1, id: 2, tags: '[1,2,3,{"truncated":true}]' },
    ]
    expect(hasTruncatedCellValues(rows)).toBe(true)
  })

  test('ignores non-string cell values', () => {
    const rows = [{ idx: 0, id: 1, active: true, balance: 100, deleted_at: null }]
    expect(hasTruncatedCellValues(rows)).toBe(false)
  })
})

describe('Header.utils: formatRowsForCopy', () => {
  const baseParams = {
    table: usersTable,
    projectRef: 'test-project',
    connectionString: null,
  }

  test('serializes rows as CSV with a header line from the table columns', async () => {
    const csv = await formatRowsForCopy({
      ...baseParams,
      rows: aliceAndBob,
      format: 'csv',
    })
    // Papa.unparse uses CRLF between rows
    expect(csv).toBe('id,name\r\n1,Alice\r\n2,Bob')
  })

  test('only emits CSV columns that exist on the table (extra row keys ignored)', async () => {
    const csv = await formatRowsForCopy({
      ...baseParams,
      rows: [{ idx: 0, id: 1, name: 'Alice', __internal: 'should-not-leak' }],
      format: 'csv',
    })
    expect(csv).toBe('id,name\r\n1,Alice')
  })

  test('serializes rows as a SQL INSERT statement with quoted identifiers', async () => {
    const sql = await formatRowsForCopy({
      ...baseParams,
      rows: aliceAndBob,
      format: 'sql',
    })
    expect(sql).toBe(`INSERT INTO "public"."users" ("id", "name") VALUES (1, 'Alice'), (2, 'Bob');`)
  })

  test('escapes single quotes in text values when serializing to SQL', async () => {
    const sql = await formatRowsForCopy({
      ...baseParams,
      rows: [{ idx: 0, id: 1, name: "O'Brien" }],
      format: 'sql',
    })
    expect(sql).toBe(`INSERT INTO "public"."users" ("id", "name") VALUES (1, 'O''Brien');`)
  })

  test('serializes rows as a JSON string', async () => {
    const json = await formatRowsForCopy({
      ...baseParams,
      rows: aliceAndBob,
      format: 'json',
    })
    expect(JSON.parse(json)).toStrictEqual(aliceAndBob)
  })

  test('throws when a row has a truncated cell but the table has no primary key', async () => {
    const tableWithoutPk: SupaTable = { ...usersTable, primaryKey: undefined }
    const rows = [{ idx: 0, id: 1, tags: '[1,2,3,{"truncated":true}]' }]

    await expect(
      formatRowsForCopy({
        ...baseParams,
        table: tableWithoutPk,
        rows,
        format: 'csv',
      })
    ).rejects.toThrow(/truncated/i)
  })
})
