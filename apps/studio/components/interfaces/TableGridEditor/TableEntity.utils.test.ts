import { describe, expect, it } from 'vitest'

import { formatTableRowsToSQL, getTablePoliciesUrl } from './TableEntity.utils'
import type { SupaTable } from '@/components/grid/types'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

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
    const expected = `INSERT INTO "public"."people" ("id", "name") VALUES (1, 'Person 1'), (2, 'Person 2'), (3, 'Person 3');`
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
    const expected = `INSERT INTO "public"."people" ("id", "name") VALUES (1, 'Person 1'), (2, null), (3, 'Person 3');`
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
    const expected = `INSERT INTO "public"."demo" ("id", "name", "tags", "metadata") VALUES (2, 'Person 1', ARRAY['tag-a','tag-c'], '{"version": 1}'), (3, 'ONeil', ARRAY['tag-a'], '{"version": 1, "name": "O''Neil"}');`
    expect(result).toBe(expected)
  })

  it('should emit valid Postgres literals for booleans, numbers and text arrays', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'text', format: 'text', position: 0 },
        { name: 'public', dataType: 'bool', format: 'bool', position: 1 },
        { name: 'avif_autodetection', dataType: 'bool', format: 'bool', position: 2 },
        { name: 'file_size_limit', dataType: 'int8', format: 'int8', position: 3 },
        { name: 'allowed_mime_types', dataType: 'ARRAY', format: '_text', position: 4 },
      ],
      name: 'buckets',
      schema: 'storage',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [
      {
        id: 'emails',
        public: true,
        avif_autodetection: false,
        file_size_limit: 10485760,
        allowed_mime_types: ['image/*', "image/o'neil"],
      },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "storage"."buckets" ("id", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types") VALUES ('emails', true, false, 10485760, ARRAY['image/*','image/o''neil']);`
    expect(result).toBe(expected)
  })

  it('should escape fallback string formats outside text and varchar', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [{ name: 'email', dataType: 'USER-DEFINED', format: 'citext', position: 0 }],
      name: 'users',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [{ email: "o'neil@example.com" }]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."users" ("email") VALUES ('o''neil@example.com');`
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
    const expected = `INSERT INTO "public"."people" ("id", "name") VALUES (1, 'Person 1'), (2, 'Person 2');`
    expect(result).toBe(expected)
  })
})

describe('TableEntity.utils: getTablePoliciesUrl', () => {
  it('builds the policies url for plain schema and name values', () => {
    expect(getTablePoliciesUrl('abc', 'public', 'users')).toBe(
      '/project/abc/auth/policies?search=users&schema=public'
    )
  })

  it('preserves special characters in the table name', () => {
    const url = getTablePoliciesUrl('abc', 'public', 'user_data&secret=1')
    const parsed = new URL(url, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('user_data&secret=1')
    expect(parsed.searchParams.get('schema')).toBe('public')
  })

  it('preserves special characters in the schema', () => {
    const url = getTablePoliciesUrl('abc', 'my schema+x', 'users')
    const parsed = new URL(url, 'http://example.com')
    expect(parsed.searchParams.get('schema')).toBe('my schema+x')
    expect(parsed.searchParams.get('search')).toBe('users')
  })

  it('encodes both the table name and schema together', () => {
    const url = getTablePoliciesUrl('abc', 'a&b=c', 'd e+f')
    const parsed = new URL(url, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('d e+f')
    expect(parsed.searchParams.get('schema')).toBe('a&b=c')
  })
})
