import {
  buildTableRowsQuery,
  escapeIdentifier,
  shouldTruncateColumn,
  ADDITIONAL_LARGE_TYPES,
} from './table-rows-select-query-builder'
import { describe, it, expect } from 'vitest'

describe('buildTableRowsQuery', () => {
  // Helper function to create a basic table for testing
  const createTestTable = (columns: any[], tableName = 'test_table') => ({
    id: 1,
    name: tableName,
    schema: 'public',
    columns,
    estimateRowCount: 10,
  })

  describe('escapeIdentifier', () => {
    it('should properly escape identifier with quotes', () => {
      expect(escapeIdentifier('normal')).toMatchInlineSnapshot('"normal"')
      expect(escapeIdentifier('with"quotes')).toMatchInlineSnapshot('"with""quotes"')
      expect(escapeIdentifier('multiple"quote"instances')).toMatchInlineSnapshot(
        '"multiple""quote""instances"'
      )
      expect(escapeIdentifier("with'single'quotes")).toMatchInlineSnapshot('"with\'single\'quotes"')
    })
  })

  describe('shouldTruncateColumn', () => {
    it('should identify text and json columns for truncation', () => {
      expect(shouldTruncateColumn({ format: 'text', dataType: 'text' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'varchar', dataType: 'varchar' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'json', dataType: 'json' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'jsonb', dataType: 'jsonb' })).toBe(true)
    })

    it('should identify additional large data types for truncation', () => {
      ADDITIONAL_LARGE_TYPES.forEach((type) => {
        expect(shouldTruncateColumn({ dataType: type })).toBe(true)
      })
    })

    it('should identify array types for truncation', () => {
      expect(shouldTruncateColumn({ dataType: 'array' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'ARRAY' })).toBe(true)
    })

    it('should identify user-defined and domain types for truncation', () => {
      expect(shouldTruncateColumn({ format: 'user-defined' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'domain' })).toBe(true)
    })

    it('should identify vector-like types for truncation (like pgvector)', () => {
      expect(shouldTruncateColumn({ dataType: 'vector' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'vector(1536)' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'embedding_vector' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'custom_vector_type' })).toBe(true)
    })

    it('should identify PostgreSQL array notation types for truncation', () => {
      expect(shouldTruncateColumn({ dataType: '_int4' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: '_varchar' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: '_numeric' })).toBe(true)
    })

    it('should identify PostGIS types for truncation', () => {
      expect(shouldTruncateColumn({ dataType: 'geometry' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'geography' })).toBe(true)
    })

    it('should not truncate regular numeric or boolean columns', () => {
      expect(shouldTruncateColumn({ format: 'int8', dataType: 'bigint' })).toBe(false)
      expect(shouldTruncateColumn({ format: 'int4', dataType: 'integer' })).toBe(false)
      expect(shouldTruncateColumn({ format: 'bool', dataType: 'boolean' })).toBe(false)
      expect(shouldTruncateColumn({ format: 'float8', dataType: 'double precision' })).toBe(false)
    })
  })

  it('should generate a query with proper column escaping for regular column names', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'name', format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should handle columns with special characters and spaces', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'user name', format: 'text', dataType: 'text' },
      { name: 'special!column@#$', format: 'text', dataType: 'text' },
      { name: '123numeric', format: 'int4', dataType: 'integer' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should properly handle column names with double quotes', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'column"with"quotes', format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should properly handle column names with single quotes', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: "column'with'quotes", format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should properly handle table names with quotes', () => {
    const table = createTestTable(
      [
        { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
        { name: 'name', format: 'text', dataType: 'text' },
      ],
      'table"with"quotes'
    )

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should properly handle mixed quotes and special characters', () => {
    const table = createTestTable(
      [
        { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
        { name: 'complex"column\'with@#$chars', format: 'text', dataType: 'text' },
        { name: 'multiple""double""quotes', format: 'text', dataType: 'text' },
        { name: '123"numeric"45', format: 'int4', dataType: 'integer' },
      ],
      'table"with\'mixed@#_quotes'
    )

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should handle text column with quotes that needs truncation', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'text"with"quotes', format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should apply truncation to text, json, and other large data types', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'text_col', format: 'text', dataType: 'text' },
      { name: 'json_col', format: 'json', dataType: 'json' },
      { name: 'bytea_col', format: 'bytea', dataType: 'bytea' },
      { name: 'xml_col', format: 'xml', dataType: 'xml' },
      { name: 'hstore_col', format: 'hstore', dataType: 'hstore' },
      { name: 'array_col', format: 'array', dataType: 'array' },
      { name: 'int_col', format: 'int4', dataType: 'integer' },
      { name: 'bool_col', format: 'bool', dataType: 'boolean' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should handle array-based enum columns by adding ::text[] cast', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      {
        name: 'enum_array',
        format: 'text',
        dataType: 'array',
        enum: ['value1', 'value2'],
      },
      {
        name: 'regular_array',
        format: 'text',
        dataType: 'array',
        enum: [],
      },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should handle columns with uppercase names', () => {
    const table = createTestTable([
      { name: 'ID', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'UserName', format: 'text', dataType: 'text' },
      { name: 'DATA', format: 'json', dataType: 'json' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should apply pagination correctly', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'name', format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({
      table: table as any,
      page: 2,
      limit: 10,
    })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should handle table with schema', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'name', format: 'text', dataType: 'text' },
    ])
    table.schema = 'custom_schema'

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })

  it('should apply sorting based on primary key when no sorts provided', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'name', format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })

    expect(sql).toContain('ORDER BY "test_table"."id" ASC NULLS FIRST')
  })

  it('should apply custom sorting when provided', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'name', format: 'text', dataType: 'text' },
    ])

    const sql = buildTableRowsQuery({
      table: table as any,
      sorts: [{ column: 'name', table: 'test_table', ascending: false, nullsFirst: false }],
    })

    expect(sql).toContain('ORDER BY "test_table"."name" DESC NULLS LAST')
  })

  it('should handle empty table case', () => {
    const sql = buildTableRowsQuery({ table: undefined as any })
    expect(sql).toBe('')
  })

  it('should apply truncation to extension types', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'vector_col', format: 'user-defined', dataType: 'vector' },
      { name: 'geometry_col', format: 'user-defined', dataType: 'geometry' },
      { name: 'tsvector_col', format: 'user-defined', dataType: 'tsvector' },
      { name: 'range_col', format: 'user-defined', dataType: 'daterange' },
      { name: 'int_col', format: 'int4', dataType: 'integer' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })

    // Vector column should be truncated
    expect(sql).toContain(`"vector_col"::text`)

    // Geometry column should be truncated
    expect(sql).toContain(`"geometry_col"::text`)

    // TSVector column should be truncated
    expect(sql).toContain(`"tsvector_col"::text`)

    // Range column should be truncated
    expect(sql).toContain(`"range_col"::text`)

    // Integer column should not be truncated
    expect(sql).toContain('"int_col"')
    expect(sql).not.toContain('"int_col"::text')
  })

  it('should handle extension-specific types like vector data', () => {
    const table = createTestTable([
      { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
      { name: 'embedding', format: 'user-defined', dataType: 'vector' },
      { name: 'geometry_data', format: 'user-defined', dataType: 'geometry' },
      { name: 'tsvector_data', format: 'user-defined', dataType: 'tsvector' },
    ])

    const sql = buildTableRowsQuery({ table: table as any })
    expect(sql).toMatchInlineSnapshot()
  })
})
