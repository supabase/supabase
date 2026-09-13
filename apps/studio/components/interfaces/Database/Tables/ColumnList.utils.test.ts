import { describe, expect, it } from 'vitest'

import {
  getColumnTypeAffordance,
  getForeignKeyColumnNames,
  getPrimaryKeyColumnNames,
  getUniqueIndexColumnNames,
} from './ColumnList.utils'

describe('ColumnList.utils', () => {
  it('normalises quoted array formats before resolving the affordance kind', () => {
    expect(getColumnTypeAffordance('"uuid"[]')).toEqual({
      kind: 'text',
      label: 'Text',
    })
  })

  it('maps recognised Postgres formats to their affordance labels', () => {
    expect(getColumnTypeAffordance('timestamptz')).toEqual({
      kind: 'time',
      label: 'Date / time',
    })
    expect(getColumnTypeAffordance('jsonb')).toEqual({
      kind: 'json',
      label: 'JSON',
    })
  })

  it('falls back to the other affordance for unrecognised formats', () => {
    expect(getColumnTypeAffordance('citext')).toEqual({
      kind: 'other',
      label: 'Other',
    })
  })

  it('derives only source-table foreign key column names', () => {
    const table = {
      schema: 'public',
      name: 'orders',
      primary_keys: [{ name: 'id' }],
      relationships: [
        {
          source_schema: 'public',
          source_table_name: 'orders',
          source_column_name: 'customer_id',
          target_table_schema: 'public',
          target_table_name: 'customers',
          target_column_name: 'id',
        },
        {
          source_schema: 'public',
          source_table_name: 'customers',
          source_column_name: 'account_id',
          target_table_schema: 'public',
          target_table_name: 'accounts',
          target_column_name: 'id',
        },
      ],
      unique_indexes: [{ columns: ['reference'] }, { columns: ['customer_id', 'reference'] }],
    } as const

    expect([...getPrimaryKeyColumnNames(table)]).toEqual(['id'])
    expect([...getForeignKeyColumnNames(table)]).toEqual(['customer_id'])
    expect([...getUniqueIndexColumnNames(table)]).toEqual(['reference'])
  })
})
