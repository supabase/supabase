import type { Column } from '@supabase/mcp-server-supabase/apps'
import { describe, expect, it } from 'vitest'

import { testTable } from '../test-utils'
import { buildRowValues, initialRowDraft, parseCellValue } from './row-values'

const column: Column = {
  name: 'value',
  format: 'text',
  data_type: 'text',
  nullable: true,
  enums: [],
  editable: true,
  generated: false,
}

describe('parseCellValue', () => {
  it('keeps large numbers as strings so int8 and numeric values do not lose precision', () => {
    expect(parseCellValue({ ...column, format: 'int8' }, '9007199254740993', false)).toBe(
      '9007199254740993'
    )
    expect(
      parseCellValue({ ...column, format: 'numeric' }, '12345678901234567890.12345', false)
    ).toBe('12345678901234567890.12345')
  })

  it('distinguishes NULL from empty text, and refuses NULL where the column forbids it', () => {
    expect(parseCellValue(column, '', false)).toBe('')
    expect(parseCellValue(column, '', true)).toBeNull()
    expect(() => parseCellValue({ ...column, nullable: false }, '', true)).toThrow('NULL')
  })

  it('rejects values that do not fit the column type before they reach the database', () => {
    expect(() => parseCellValue({ ...column, format: 'int4' }, '12.3', false)).toThrow(
      'whole number'
    )
    expect(() => parseCellValue({ ...column, format: 'numeric' }, 'NaN', false)).toThrow('number')
    expect(() => parseCellValue({ ...column, format: 'bool' }, 'yes', false)).toThrow(
      'true or false'
    )
    expect(parseCellValue({ ...column, format: 'bool' }, 'false', false)).toBe(false)
  })

  it('writes JSON and array fields as structured values', () => {
    expect(parseCellValue({ ...column, format: 'jsonb' }, '{"nested":[true,null]}', false)).toEqual(
      { nested: [true, null] }
    )
    const array = { ...column, format: '_text', data_type: 'ARRAY' }
    expect(parseCellValue(array, '["one",null,"two"]', false)).toEqual(['one', null, 'two'])
    expect(() => parseCellValue(array, '{}', false)).toThrow('JSON array')
  })
})

describe('buildRowValues', () => {
  const table = testTable({
    columns: [
      { ...column, name: 'id', nullable: false, identity: true },
      { ...column, name: 'label' },
      { ...column, name: 'created_at', default_value: 'now()' },
    ],
  })

  it('leaves Default fields out of an insert so the database fills them', () => {
    const draft = initialRowDraft(table)
    draft.label = { raw: 'New', mode: 'value' }
    // A column with a default starts on Default; a nullable one starts on NULL.
    expect(draft.created_at.mode).toBe('default')
    expect(buildRowValues(table, draft, [], true)).toEqual({ id: '', label: 'New' })
  })

  it('names the column when a field is invalid', () => {
    const typed = testTable({ columns: [{ ...column, name: 'count', format: 'int4' }] })
    const draft = { count: { raw: '1.5', mode: 'value' as const } }
    expect(() => buildRowValues(typed, draft, [], true)).toThrow('count: Enter a whole number.')
  })

  it('never updates primary keys or identity columns of an existing row', () => {
    const row = { id: '1', label: 'Old', created_at: 'x' }
    const draft = initialRowDraft(table, row)
    draft.id = { raw: '2', mode: 'value' }
    draft.label = { raw: 'New', mode: 'value' }
    const changed = table.columns.filter((item) => item.name !== 'created_at')
    expect(buildRowValues(table, draft, changed, true, row)).toEqual({ label: 'New' })
  })
})
