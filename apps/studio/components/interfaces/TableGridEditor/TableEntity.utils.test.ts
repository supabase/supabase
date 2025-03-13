import { describe, it, expect } from 'vitest'
import { formatTableRowsToSQL } from './TableEntity.utils'

describe('TableEntity.utils: formatTableRowsToSQL', () => {
  it('should format rows into a single SQL INSERT statement', () => {
    const table = {
      id: 1,
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
    const table = {
      id: 1,
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
    const table = {
      id: 1,
      columns: [
        { name: 'id', dataType: 'bigint', format: 'int8', position: 0 },
        { name: 'name', dataType: 'text', format: 'text', position: 1 },
        { name: 'tags', dataType: 'ARRAY', format: '_text', position: 2 },
        { name: 'digits', dataType: 'ARRAY', format: '_int4', position: 3 },
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
        digits: [1, 2, 3],
        metadata: '{"version": 1}',
      },
    ]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."demo" ("id", "name", "tags", "digits", "metadata") VALUES ('2', 'Person 1', '{"tag-a","tag-c"}', '{1,2,3}', '{"version": 1}');`
    expect(result).toBe(expected)
  })

  it('should return an empty string for empty rows', () => {
    const table = {
      id: 1,
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
    const table = {
      id: 1,
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

  it('should escape apostrophes in strings', () => {
    const table = {
      id: 1,
      columns: [{ name: 'name', dataType: 'text', format: 'text', position: 0 }],
      name: 'people',
      schema: 'public',
      estimateRowCount: 1,
    }

    const rows = [{ name: "O'Reilly" }]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("name") VALUES ('O''Reilly');`
    expect(result).toBe(expected)
  })

  it('should handle special characters in strings', () => {
    const table = {
      id: 1,
      columns: [{ name: 'name', dataType: 'text', format: 'text', position: 0 }],
      name: 'people',
      schema: 'public',
      estimateRowCount: 1,
    }

    const rows = [{ name: 'O"Reilly\n\\here' }]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("name") VALUES ('O"Reilly\n\\here');`
    expect(result).toBe(expected)
  })

  it('should handle special characters in arrays', () => {
    const table = {
      id: 1,
      columns: [{ name: 'name', dataType: 'ARRAY', format: 'text', position: 0 }],
      name: 'people',
      schema: 'public',
      estimateRowCount: 1,
    }

    const rows = [
      { name: ["tester's", 'text""x\'x\'x', '[brackets]', '{object}', '$*slashes\\here\n\\n'] },
    ]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("name") VALUES ('{"tester''s","text\\"\\"x''x''x","[brackets]","{object}","$*slashes\\\\here\n\\\\n"}');`
    expect(result).toBe(expected)
  })

  it('should handle special characters in JSON', () => {
    const table = {
      id: 1,
      columns: [
        { name: 'object_1', dataType: 'jsonb', format: 'jsonb', position: 0 },
        { name: 'object_2', dataType: 'json', format: 'json', position: 1 },
      ],
      name: 'people',
      schema: 'public',
      estimateRowCount: 1,
    }

    const rows = [
      {
        object_1: { key: '[array] "binary"', "tester's": ['value1', { nested: "\\ye[s]'s\n\\n" }] },
        object_2: { key: '[array] "test"', "tester's": ['value1', { nested: "\\ye[s]'s\n\\n" }] },
      },
    ]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("object_1", "object_2") VALUES ('{"key":"[array] \\"binary\\"","tester''s":["value1",{"nested":"\\\\ye[s]''s\\n\\\\n"}]}', '{"key":"[array] \\"test\\"","tester''s":["value1",{"nested":"\\\\ye[s]''s\\n\\\\n"}]}');`
    expect(result).toBe(expected)
  })

  it('should handle arrays of JSON', () => {
    const table = {
      id: 1,
      columns: [{ name: 'objects', dataType: 'ARRAY', format: 'jsonb', position: 0 }],
      name: 'people',
      schema: 'public',
      estimateRowCount: 1,
    }

    const rows = [
      {
        objects: [
          { key: 'value' },
          {
            key: '[array] "binary"',
            "tester's": ['value1', { nested: "\\ye[s]'s\n\\n" }],
          },
        ],
      },
    ]
    const result = formatTableRowsToSQL(table, rows)
    const expected = `INSERT INTO "public"."people" ("objects") VALUES ('{"{\\"key\\":\\"value\\"}","{\\"key\\":\\"[array] \\\\\\"binary\\\\\\"\\",\\"tester''s\\":[\\"value1\\",{\\\"nested\\":\\"\\\\\\\\ye[s]''s\\\\n\\\\\\\\n\\"}]}"}');`
    expect(result).toBe(expected)
  })
})
