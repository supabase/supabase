import { beforeEach, describe, expect, test, vi } from 'vitest'

import { executeSql } from '@/data/sql/execute-sql-mutation'
import {
  IMPORT_SQL_SIZE_LIMIT,
  buildImportInsertBatches,
  executeImportInsertBatch,
  formatRowsForInsert,
  getRowFromSidePanel,
} from './SidePanelEditor.utils'
import type { SupaRow } from '@/components/grid/types'
import type { SidePanel } from '@/state/table-editor'

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: vi.fn(),
}))

const mockExecuteSql = vi.mocked(executeSql)

const mockTable = {
  id: 1,
  name: 'import_test',
  schema: 'public',
  columns: [
    { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
    { id: '2', name: 'name', data_type: 'text', format: 'text', is_nullable: true },
    { id: '3', name: 'geom', data_type: 'USER-DEFINED', format: 'geometry', is_nullable: true },
  ],
} as any

function getByteSize(value: string) {
  return new Blob([value]).size
}

function makeLargeWktCoordinate(index: number) {
  return `-111.${String(index).padStart(12, '0')} 34.${String(index).padStart(12, '0')}`
}

beforeEach(() => {
  mockExecuteSql.mockReset()
})

describe('SidePanelEditor.utils.test.ts', () => {
  test('formatRowsForInsert should for format rows with basic data types correctly', () => {
    const rows = [
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
      { id: 3, text: 'C' },
    ]
    const headers = ['id', 'text']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'text', data_type: 'text', format: 'text', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({ rows, headers, columns: columns as any })
    expect(formattedRows).toEqual(rows)
  })

  test('formatRowsForInsert should handle nullable columns if value is an empty string', () => {
    const rows = [
      { id: 1, text: 'A' },
      { id: 2, text: '' },
      { id: 3, text: 'C' },
    ]
    const headers = ['id', 'text']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'text', data_type: 'text', format: 'text', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({ rows, headers, columns: columns as any })
    expect(formattedRows).toEqual([
      { id: 1, text: 'A' },
      { id: 2, text: null },
      { id: 3, text: 'C' },
    ])
  })

  test('formatRowsForInsert should only convert empty strings to null for selected columns', () => {
    const rows = [
      { id: 1, name: '', email: '' },
      { id: 2, name: 'Bob', email: '' },
    ]
    const headers = ['id', 'name', 'email']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'name', data_type: 'text', format: 'text', is_nullable: true },
      { id: '3', name: 'email', data_type: 'text', format: 'text', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({
      rows,
      headers,
      columns: columns as any,
      emptyStringAsNullHeaders: ['email'],
    })

    expect(formattedRows).toEqual([
      { id: 1, name: '', email: null },
      { id: 2, name: 'Bob', email: null },
    ])
  })

  test('formatRowsForInsert should handle JSON object values properly', () => {
    const rows = [{ id: 1, value: '{"key": "value"}' }]
    const headers = ['id', 'value']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'value', data_type: 'json', format: 'jsonb', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({ rows, headers, columns: columns as any })
    expect(formattedRows).toEqual([{ id: 1, value: { key: 'value' } }])
  })

  test('formatRowsForInsert should handle JSON array values properly', () => {
    const rows = [{ id: 1, value: '["item1", "item2", "item3"]' }]
    const headers = ['id', 'value']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'value', data_type: 'json', format: 'jsonb', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({ rows, headers, columns: columns as any })
    expect(formattedRows).toEqual([{ id: 1, value: ['item1', 'item2', 'item3'] }])
  })

  test('formatRowsForInsert should handle Postgres array values properly', () => {
    const rows = [{ id: 1, value: '{"item1", "item2", "item3"}' }]
    const headers = ['id', 'value']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'value', data_type: 'ARRAY', format: '_text', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({ rows, headers, columns: columns as any })
    expect(formattedRows).toEqual([{ id: 1, value: ['item1', 'item2', 'item3'] }])
  })

  test('formatRowsForInsert should handle Postgres array values properly if provided JSON string', () => {
    const rows = [{ id: 1, value: '["item1", "item2", "item3"]' }]
    const headers = ['id', 'value']
    const columns = [
      { id: '1', name: 'id', data_type: 'bigint', format: 'int8', is_nullable: false },
      { id: '2', name: 'value', data_type: 'ARRAY', format: '_text', is_nullable: true },
    ]

    const formattedRows = formatRowsForInsert({ rows, headers, columns: columns as any })
    expect(formattedRows).toEqual([{ id: 1, value: ['item1', 'item2', 'item3'] }])
  })
})

describe('import insert batching', () => {
  test('buildImportInsertBatches keeps a large geometry row under the SQL size limit', () => {
    const largeWkt = `MULTIPOLYGON(((${Array.from({ length: 8_000 }, (_, index) =>
      makeLargeWktCoordinate(index)
    ).join(',')})))`

    expect(getByteSize(largeWkt)).toBeGreaterThan(260_000)

    const batches = buildImportInsertBatches({
      table: mockTable,
      rows: [{ id: '1', name: 'large shape', geom: largeWkt }],
    })

    expect(batches).toHaveLength(1)
    expect(batches[0].rows).toHaveLength(1)
    expect(getByteSize(batches[0].sql)).toBeLessThan(IMPORT_SQL_SIZE_LIMIT)
  })

  test('buildImportInsertBatches groups small rows into a single batch when possible', () => {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      id: String(index + 1),
      name: `row ${index + 1}`,
      geom: `POINT(${index} ${index})`,
    }))

    const batches = buildImportInsertBatches({ table: mockTable, rows })

    expect(batches).toHaveLength(1)
    expect(batches[0].rows).toEqual(rows)
  })

  test('buildImportInsertBatches splits rows by generated SQL byte size', () => {
    const rows = [
      { id: '1', name: 'first'.repeat(20), geom: 'POINT(0 0)' },
      { id: '2', name: 'second'.repeat(20), geom: 'POINT(1 1)' },
      { id: '3', name: 'third'.repeat(20), geom: 'POINT(2 2)' },
    ]

    const batches = buildImportInsertBatches({ table: mockTable, rows, maxSqlBytes: 500 })

    expect(batches.length).toBeGreaterThan(1)
    expect(batches.flatMap((batch) => batch.rows)).toEqual(rows)
    expect(batches.every((batch) => getByteSize(batch.sql) <= 500)).toBe(true)
  })

  test('buildImportInsertBatches rejects a single row that exceeds the SQL byte limit', () => {
    expect(() =>
      buildImportInsertBatches({
        table: mockTable,
        rows: [{ id: '1', name: 'too large', geom: 'POINT(0 0)'.repeat(100) }],
        maxSqlBytes: 100,
      })
    ).toThrow(/too large/i)
  })

  test('executeImportInsertBatch rejects when the SQL request is aborted by timeout', async () => {
    mockExecuteSql.mockImplementation((_args, signal) => {
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(signal.reason ?? new Error('Import request timed out'))
        })
      }) as any
    })

    await expect(
      executeImportInsertBatch({
        projectRef: 'project-ref',
        connectionString: undefined,
        sql: 'select 1;' as any,
        timeoutMs: 1,
      })
    ).rejects.toThrow()

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
  })
})

describe('getRowFromSidePanel', () => {
  const mockRow: SupaRow = { idx: 1, id: 123, name: 'Test Row' }

  test('returns undefined when sidePanel is undefined', () => {
    expect(getRowFromSidePanel(undefined)).toBeUndefined()
  })

  test('returns row from json side panel', () => {
    const sidePanel: SidePanel = {
      type: 'json',
      jsonValue: { row: mockRow, column: 'data', value: '{}' },
    }
    expect(getRowFromSidePanel(sidePanel)).toEqual(mockRow)
  })

  test('returns row from cell side panel', () => {
    const sidePanel: SidePanel = {
      type: 'cell',
      value: { row: mockRow, column: 'name' },
    }
    expect(getRowFromSidePanel(sidePanel)).toEqual(mockRow)
  })

  test('returns undefined from cell side panel when value is undefined', () => {
    const sidePanel: SidePanel = {
      type: 'cell',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })

  test('returns row from row side panel', () => {
    const sidePanel: SidePanel = {
      type: 'row',
      row: mockRow,
    }
    expect(getRowFromSidePanel(sidePanel)).toEqual(mockRow)
  })

  test('returns undefined from row side panel when row is undefined', () => {
    const sidePanel: SidePanel = {
      type: 'row',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })

  test('returns row from foreign-row-selector side panel', () => {
    const sidePanel: SidePanel = {
      type: 'foreign-row-selector',
      foreignKey: {
        foreignKey: {
          schema: 'public',
          table: 'users',
          columns: [{ source: 'user_id', target: 'id' }],
          deletionAction: 'NO ACTION',
          updateAction: 'NO ACTION',
        },
        row: mockRow,
        column: { name: 'user_id' } as any,
      },
    }
    expect(getRowFromSidePanel(sidePanel)).toEqual(mockRow)
  })

  test('returns undefined for table side panel', () => {
    const sidePanel: SidePanel = {
      type: 'table',
      mode: 'new',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })

  test('returns undefined for column side panel', () => {
    const sidePanel: SidePanel = {
      type: 'column',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })

  test('returns undefined for schema side panel', () => {
    const sidePanel: SidePanel = {
      type: 'schema',
      mode: 'new',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })

  test('returns undefined for csv-import side panel', () => {
    const sidePanel: SidePanel = {
      type: 'csv-import',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })

  test('returns undefined for operation-queue side panel', () => {
    const sidePanel: SidePanel = {
      type: 'operation-queue',
    }
    expect(getRowFromSidePanel(sidePanel)).toBeUndefined()
  })
})
