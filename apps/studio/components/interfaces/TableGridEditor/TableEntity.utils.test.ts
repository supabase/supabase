import { describe, expect, it } from 'vitest'

import {
  formatTableRowsToJSON,
  formatTableRowsToSQL,
  getTablePoliciesUrl,
  JSON_NULL,
  parseGridJsonColumns,
} from './TableEntity.utils'
import type { SupaTable } from '@/components/grid/types'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

describe('TableEntity.utils: formatTableRowsToJSON', () => {
  const table: SupaTable = {
    id: 1,
    type: ENTITY_TYPE.TABLE,
    columns: [
      { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
      { name: '2024', dataType: 'bigint', format: 'int8', position: 1 },
      { name: '2023', dataType: 'bigint', format: 'int8', position: 2 },
      { name: 'meta', dataType: 'jsonb', format: 'jsonb', position: 3 },
    ],
    name: 'yearly_totals',
    schema: 'public',
    comment: undefined,
    estimateRowCount: 1,
  }

  it('should follow column order, including integer-like column names', () => {
    const rows = [{ idx: 0, '2023': 42, '2024': 99, id: 7, meta: { a: 1 } }]
    expect(formatTableRowsToJSON(table, rows)).toBe(`[{"id":7,"2024":99,"2023":42,"meta":{"a":1}}]`)
  })

  it('should omit the grid idx key unless the table has an idx column', () => {
    expect(formatTableRowsToJSON(table, [{ idx: 3, id: 1 }])).not.toContain('idx')

    const withIdx: SupaTable = {
      ...table,
      columns: [{ name: 'idx', dataType: 'bigint', format: 'int8', position: 0 }],
    }
    expect(formatTableRowsToJSON(withIdx, [{ idx: 3 }])).toBe(`[{"idx":3}]`)
  })

  it('should emit null for missing columns and [] for no rows', () => {
    expect(formatTableRowsToJSON(table, [{ id: 1 }])).toBe(
      `[{"id":1,"2024":null,"2023":null,"meta":null}]`
    )
    expect(formatTableRowsToJSON(table, [])).toBe('[]')
  })
})

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
    const expected = `INSERT INTO public.people (id, name) VALUES (1, 'Person 1'), (2, 'Person 2'), (3, 'Person 3');`
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
    const expected = `INSERT INTO public.people (id, name) VALUES (1, 'Person 1'), (2, null), (3, 'Person 3');`
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
        metadata: { version: 1 },
      },
      {
        idx: 2,
        id: 3,
        name: 'ONeil',
        tags: ['tag-a'],
        metadata: { version: 1, name: "O'Neil" },
      },
    ]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO public.demo (id, name, tags, metadata) VALUES (2, 'Person 1', ARRAY['tag-a','tag-c'], '{"version":1}'), (3, 'ONeil', ARRAY['tag-a'], '{"version":1,"name":"O''Neil"}');`
    expect(result).toBe(expected)
  })

  it('should emit an untyped literal for empty arrays', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [{ name: 'tags', dataType: 'ARRAY', format: '_text', position: 0 }],
      name: 'demo',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    expect(formatTableRowsToSQL(table, [{ tags: [] }, { tags: ['a'] }])).toBe(
      `INSERT INTO public.demo (tags) VALUES ('{}'), (ARRAY['a']);`
    )
  })

  it('should escape quotes and backslashes in json and jsonb values', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'a', dataType: 'jsonb', format: 'jsonb', position: 0 },
        { name: 'b', dataType: 'json', format: 'json', position: 1 },
      ],
      name: 'demo',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [
      { a: { text: 'say "hi"', path: 'C:\\dir', note: "it's" }, b: 'plain "string"' },
      { a: 'hello', b: [1, 'two'] },
      { a: 42, b: true },
      { a: null },
    ]
    expect(formatTableRowsToSQL(table, rows)).toBe(
      `INSERT INTO public.demo (a, b) VALUES ` +
        `('{"text":"say \\"hi\\"","path":"C:\\\\dir","note":"it''s"}', '"plain \\"string\\""'), ` +
        `('"hello"', '[1,"two"]'), ` +
        `('42', 'true'), ` +
        `(null, null);`
    )
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
    const expected = `INSERT INTO storage.buckets (id, public, avif_autodetection, file_size_limit, allowed_mime_types) VALUES ('emails', true, false, 10485760, ARRAY['image/*','image/o''neil']);`
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
    const expected = `INSERT INTO public.users (email) VALUES ('o''neil@example.com');`
    expect(result).toBe(expected)
  })

  it('should keep values aligned with columns when column names are integer-like', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: '2024', dataType: 'bigint', format: 'int8', position: 1 },
        { name: '2023', dataType: 'bigint', format: 'int8', position: 2 },
      ],
      name: 'yearly_totals',
      schema: 'public',
      comment: undefined,
      estimateRowCount: 1,
    }
    // JS hoists integer-like keys to the front of Object.entries, regardless of insertion order
    const rows = [{ idx: 0, id: 7, '2024': 99, '2023': 42 }]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO public.yearly_totals (id, "2024", "2023") VALUES (7, 99, 42);`
    expect(result).toBe(expected)
  })

  it('should emit null for columns missing from a row', () => {
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

    const result = formatTableRowsToSQL(table, [{ id: 1 }])
    expect(result).toBe(`INSERT INTO public.people (id, name) VALUES (1, null);`)
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

  it('should escape double quotes in schema, table and column identifiers', () => {
    const table: SupaTable = {
      id: 1,
      type: ENTITY_TYPE.TABLE,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'we"ird', dataType: 'text', format: 'text', position: 1 },
      ],
      name: 'pe"ople',
      schema: 'pub"lic',
      comment: undefined,
      estimateRowCount: 1,
    }
    const rows = [{ id: 1, 'we"ird': 'value' }]

    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "pub""lic"."pe""ople" (id, "we""ird") VALUES (1, 'value');`
    expect(result).toBe(expected)
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
    const expected = `INSERT INTO public.people (id, name) VALUES (1, 'Person 1'), (2, 'Person 2');`
    expect(result).toBe(expected)
  })
})

describe('TableEntity.utils: getTablePoliciesUrl', () => {
  it('builds the policies url for plain schema and name values', () => {
    expect(getTablePoliciesUrl('abc', 'public', 'users')).toBe(
      '/project/abc/database/policies?search=users&schema=public'
    )
  })

  it('preserves special characters in the table name and schema', () => {
    const url = getTablePoliciesUrl('abc', 'a&b=c', 'd e+f')
    const parsed = new URL(url, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('d e+f')
    expect(parsed.searchParams.get('schema')).toBe('a&b=c')
  })
})

describe('TableEntity.utils: parseGridJsonColumns', () => {
  const table: SupaTable = {
    id: 1,
    type: ENTITY_TYPE.TABLE,
    columns: [
      { name: 'note', dataType: 'text', format: 'text', position: 0 },
      { name: 'meta', dataType: 'jsonb', format: 'jsonb', position: 1 },
      { name: 'tags', dataType: 'ARRAY', format: '_jsonb', position: 2 },
    ],
    name: 'demo',
    schema: 'public',
    comment: undefined,
    estimateRowCount: 1,
  }

  it('parses json text so the SQL formatter does not double-encode it', () => {
    const rows = [
      { note: '{"a":1}', meta: '{"text":"say \\"hi\\""}', tags: ['{"x":1}'] },
      { note: 'n', meta: '"hello"', tags: [] },
    ]
    const parsed = parseGridJsonColumns(table, rows, () => false)
    expect(parsed[0]).toEqual({ note: '{"a":1}', meta: { text: 'say "hi"' }, tags: ['{"x":1}'] })
    expect(parsed[1].meta).toBe('hello')
    expect(formatTableRowsToSQL(table, parsed.slice(1))).toContain(`'"hello"'`)
  })

  it('keeps a JSON null distinct from a SQL NULL', () => {
    const parsed = parseGridJsonColumns(table, [{ note: 'n', meta: 'null', tags: [] }], () => false)
    expect(parsed[0].meta).toBe(JSON_NULL)
    expect(formatTableRowsToSQL(table, [parsed[0], { note: 'n', meta: null }])).toContain(
      `VALUES ('n', 'null', '{}'), ('n', null, null);`
    )
  })

  it('leaves truncated and null values alone', () => {
    const rows = [
      { note: 'n', meta: '{"a":1...', tags: [] },
      { note: 'n', meta: null, tags: [] },
    ]
    const parsed = parseGridJsonColumns(table, rows, (v) => v.endsWith('...'))
    expect(parsed[0].meta).toBe('{"a":1...')
    expect(parsed[1].meta).toBeNull()
  })
})
