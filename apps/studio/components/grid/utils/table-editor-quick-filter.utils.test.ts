import { describe, expect, it } from 'vitest'

import type { SupaTable } from '@/components/grid/types'

import {
  buildTableEditorActiveFilter,
  buildTableEditorQuickFilter,
  getQuickFilterColumns,
} from './table-editor-quick-filter.utils'

const employeesTable = {
  name: 'employees',
  schema: 'public',
  primaryKey: ['id'],
  columns: [
    { name: 'id', format: 'int4', dataType: 'integer' },
    { name: 'name', format: 'text', dataType: 'text' },
    { name: 'email', format: 'text', dataType: 'text' },
    { name: 'department', format: 'text', dataType: 'text' },
  ],
} as SupaTable

describe('getQuickFilterColumns', () => {
  it('returns id, name, and email when present', () => {
    expect(getQuickFilterColumns(employeesTable)).toEqual(['id', 'name', 'email'])
  })

  it('uses the primary key when id is not the column name', () => {
    const table = {
      ...employeesTable,
      primaryKey: ['employee_id'],
      columns: [
        { name: 'employee_id', format: 'int4', dataType: 'integer' },
        { name: 'name', format: 'text', dataType: 'text' },
      ],
    } as SupaTable

    expect(getQuickFilterColumns(table)).toEqual(['employee_id', 'name'])
  })
})

describe('buildTableEditorActiveFilter', () => {
  it('returns null for empty input', () => {
    expect(buildTableEditorActiveFilter(employeesTable, '   ')).toBeNull()
  })

  it('builds a chip matching the prototype shape', () => {
    expect(buildTableEditorActiveFilter(employeesTable, 'Richard')).toEqual({
      column: 'name',
      operator: '~~*',
      value: 'Richard',
    })
  })
})

describe('buildTableEditorQuickFilter', () => {
  it('returns searchable columns for backend OR filtering', () => {
    expect(buildTableEditorQuickFilter(employeesTable, 'richard')).toEqual({
      columns: ['id', 'name', 'email'],
      value: 'richard',
    })
  })
})
