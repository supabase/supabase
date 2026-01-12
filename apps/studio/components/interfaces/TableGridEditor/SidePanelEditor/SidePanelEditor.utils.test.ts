import { describe, expect, test } from 'vitest'
import { formatRowsForInsert } from './SidePanelEditor.utils'

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
