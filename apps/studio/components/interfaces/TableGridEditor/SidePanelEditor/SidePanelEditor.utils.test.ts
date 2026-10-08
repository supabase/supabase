import { describe, expect, test } from 'vitest'

import {
  filterForeignRowValue,
  formatRowsForInsert,
  getRowFromSidePanel,
} from './SidePanelEditor.utils'
import type { SupaRow } from '@/components/grid/types'
import type { SidePanel } from '@/state/table-editor'

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

describe('filterForeignRowValue', () => {
  test('restricts a composite FK value down to only the edited column', () => {
    // e.g. the user double-clicked role_id, but the FK selector resolved values for
    // every source column in the composite key (role_id + tenant_id)
    const value = { role_id: 'role-2', tenant_id: 'tenant-B' }

    expect(filterForeignRowValue(value, 'role_id')).toEqual({ role_id: 'role-2' })
  })

  test('restricts down to whichever column of the composite key was actually edited', () => {
    const value = { role_id: 'role-2', tenant_id: 'tenant-B' }

    expect(filterForeignRowValue(value, 'tenant_id')).toEqual({ tenant_id: 'tenant-B' })
  })

  test('leaves a single-column FK value unchanged', () => {
    const value = { user_id: '123' }

    expect(filterForeignRowValue(value, 'user_id')).toEqual({ user_id: '123' })
  })

  test('preserves a null value for the edited column (Set NULL action)', () => {
    const value = { role_id: null, tenant_id: 'tenant-B' }

    expect(filterForeignRowValue(value, 'role_id')).toEqual({ role_id: null })
  })

  test('passes the value through unchanged when no edited column is known', () => {
    // The Row Editor panel flow doesn't track a single edited column since the user
    // reviews every field before saving there
    const value = { role_id: 'role-2', tenant_id: 'tenant-B' }

    expect(filterForeignRowValue(value, undefined)).toEqual(value)
  })

  test('returns undefined when the value itself is undefined', () => {
    expect(filterForeignRowValue(undefined, 'role_id')).toBeUndefined()
  })
})
