import type { SupaTable } from 'components/grid/types'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { describe, expect, it } from 'vitest'
import { formatTableRowsToSQL } from './TableEntity.utils'

describe('TableEntity.utils: formatTableRowsToSQL', () => {
  it('should format rows into a single SQL INSERT statement', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'name', dataType: 'text', format: 'text', position: 1 },
      ],
      name: 'people',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [
      { id: 1, name: 'Person 1' },
      { id: 2, name: 'Person 2' },
      { id: 3, name: 'Person 3' },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("id", "name") VALUES ('1', 'Person 1'), ('2', 'Person 2'), ('3', 'Person 3');`
    expect(result).toBe(expected)
  })

  it('should not stringify null values', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'name', dataType: 'text', format: 'text', position: 1 },
      ],
      name: 'people',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [
      { id: 1, name: 'Person 1' },
      { id: 2, name: null },
      { id: 3, name: 'Person 3' },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("id", "name") VALUES ('1', 'Person 1'), ('2', null), ('3', 'Person 3');`
    expect(result).toBe(expected)
  })

  it('should handle PG JSON and array columns', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'name', dataType: 'text', format: 'text', position: 1 },
        { name: 'tags', dataType: 'ARRAY', format: '_text', position: 2 },
        { name: 'metadata', dataType: 'jsonb', format: 'jsonb', position: 3 },
      ],
      name: 'demo',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [
      {
        idx: 1,
        id: 2,
        name: 'Person 1',
        tags: ['tag-a', 'tag-c'],
        metadata: '{"version": 1}',
      },
      {
        idx: 2,
        id: 3,
        name: 'ONeil',
        tags: ['tag-a'],
        metadata: `{"version": 1, "name": "O'Neil"}`,
      },
    ]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."demo" ("id", "name", "tags", "metadata") VALUES ('2', 'Person 1', ARRAY["tag-a","tag-c"], '{"version": 1}'), ('3', 'ONeil', ARRAY["tag-a"], '{"version": 1, "name": "O''Neil"}');`
    expect(result).toBe(expected)
  })

  it('should return an empty string for empty rows', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'name', dataType: 'text', format: 'text', position: 1 },
      ],
      name: 'people',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const result = formatTableRowsToSQL(table, [])
    expect(result).toBe('')
  })

  it('should remove the idx property', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'name', dataType: 'text', format: 'text', position: 1 },
      ],
      name: 'people',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [
      { idx: 0, id: 1, name: 'Person 1' },
      { idx: 1, id: 2, name: 'Person 2' },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("id", "name") VALUES ('1', 'Person 1'), ('2', 'Person 2');`
    expect(result).toBe(expected)
  })
})
