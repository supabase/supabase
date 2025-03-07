import {
  buildTableRowsQuery,
  shouldTruncateColumn,
  ADDITIONAL_LARGE_TYPES,
} from '../../data/table-rows/table-rows-select-query-builder'
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

  describe('shouldTruncateColumn', () => {
    it('should correctly identify columns that should be truncated', () => {
      // Text and JSON types
      expect(shouldTruncateColumn({ format: 'text', dataType: 'text' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'varchar', dataType: 'varchar' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'json', dataType: 'json' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'jsonb', dataType: 'jsonb' })).toBe(true)

      // Additional large types
      ADDITIONAL_LARGE_TYPES.forEach((type) => {
        expect(shouldTruncateColumn({ dataType: type })).toBe(true)
      })

      // Array types
      expect(shouldTruncateColumn({ dataType: 'array' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'ARRAY' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: '_int4' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: '_varchar' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: '_numeric' })).toBe(true)

      // User-defined and domain types
      expect(shouldTruncateColumn({ format: 'user-defined' })).toBe(true)
      expect(shouldTruncateColumn({ format: 'domain' })).toBe(true)

      // Vector types
      expect(shouldTruncateColumn({ dataType: 'vector' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'vector(1536)' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'embedding_vector' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'custom_vector_type' })).toBe(true)

      // PostGIS types
      expect(shouldTruncateColumn({ dataType: 'geometry' })).toBe(true)
      expect(shouldTruncateColumn({ dataType: 'geography' })).toBe(true)

      // Regular numeric or boolean columns should not be truncated
      expect(shouldTruncateColumn({ format: 'int8', dataType: 'bigint' })).toBe(false)
      expect(shouldTruncateColumn({ format: 'int4', dataType: 'integer' })).toBe(false)
      expect(shouldTruncateColumn({ format: 'bool', dataType: 'boolean' })).toBe(false)
      expect(shouldTruncateColumn({ format: 'float8', dataType: 'double precision' })).toBe(false)
    })
  })

  describe('Basic query generation', () => {
    it('should generate a query with proper column escaping for regular column names', () => {
      const table = createTestTable([
        { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
        { name: 'name', format: 'text', dataType: 'text' },
      ])

      const sql = buildTableRowsQuery({ table: table as any })
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(name::text) > 10240 
                THEN left(name::text, 10240) || '...'
                ELSE name::text
              END AS name from public.test_table order by test_table.id asc nulls first limit 100 offset 0;"
      `)
    })

    it('should handle table with schema', () => {
      const table = createTestTable([
        { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
        { name: 'name', format: 'text', dataType: 'text' },
      ])
      table.schema = 'custom_schema'

      const sql = buildTableRowsQuery({ table: table as any })
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(name::text) > 10240 
                THEN left(name::text, 10240) || '...'
                ELSE name::text
              END AS name from custom_schema.test_table order by test_table.id asc nulls first limit 100 offset 0;"
      `)
    })

    it('should handle empty table case', () => {
      const sql = buildTableRowsQuery({ table: undefined as any })
      expect(sql).toBe('')
    })
  })

  describe('Column formatting and escaping', () => {
    it('should properly handle mixed quotes and special characters', () => {
      const table = createTestTable(
        [
          { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
          { name: 'complex"column\'with@#$chars', format: 'text', dataType: 'text' },
          { name: 'multiple""double""quotes', format: 'text', dataType: 'text' },
          { name: '123"numeric"45', format: 'int4', dataType: 'integer' },
          { name: 'column with spaces', format: 'int4', dataType: 'integer' },
          { name: 'columnWithCase', format: 'int4', dataType: 'integer' },
        ],
        'table"with\'mixed@#_quotes'
      )

      const sql = buildTableRowsQuery({ table: table as any })
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length("complex""column'with@#$chars"::text) > 10240 
                THEN left("complex""column'with@#$chars"::text, 10240) || '...'
                ELSE "complex""column'with@#$chars"::text
              END AS "complex""column'with@#$chars",CASE
                WHEN octet_length("multiple""""double""""quotes"::text) > 10240 
                THEN left("multiple""""double""""quotes"::text, 10240) || '...'
                ELSE "multiple""""double""""quotes"::text
              END AS "multiple""""double""""quotes","123""numeric""45","column with spaces","columnWithCase" from public."table""with'mixed@#_quotes" order by "table""with'mixed@#_quotes".id asc nulls first limit 100 offset 0;"
      `)
    })

    it('should handle columns with uppercase names', () => {
      const table = createTestTable([
        { name: 'ID', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
        { name: 'UserName', format: 'text', dataType: 'text' },
        { name: 'DATA', format: 'json', dataType: 'json' },
      ])

      const sql = buildTableRowsQuery({ table: table as any })
      expect(sql).toMatchInlineSnapshot(`
        "select "ID",CASE
                WHEN octet_length("UserName"::text) > 10240 
                THEN left("UserName"::text, 10240) || '...'
                ELSE "UserName"::text
              END AS "UserName",CASE
                WHEN octet_length("DATA"::text) > 10240 
                THEN left("DATA"::text, 10240) || '...'
                ELSE "DATA"::text
              END AS "DATA" from public.test_table order by test_table."ID" asc nulls first limit 100 offset 0;"
      `)
    })
  })

  describe('Data type truncation', () => {
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
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(text_col::text) > 10240 
                THEN left(text_col::text, 10240) || '...'
                ELSE text_col::text
              END AS text_col,CASE
                WHEN octet_length(json_col::text) > 10240 
                THEN left(json_col::text, 10240) || '...'
                ELSE json_col::text
              END AS json_col,CASE
                WHEN octet_length(bytea_col::text) > 10240 
                THEN left(bytea_col::text, 10240) || '...'
                ELSE bytea_col::text
              END AS bytea_col,CASE
                WHEN octet_length(xml_col::text) > 10240 
                THEN left(xml_col::text, 10240) || '...'
                ELSE xml_col::text
              END AS xml_col,CASE
                WHEN octet_length(hstore_col::text) > 10240 
                THEN left(hstore_col::text, 10240) || '...'
                ELSE hstore_col::text
              END AS hstore_col,CASE
                WHEN octet_length(array_col::text) > 10240 
                THEN left(array_col::text, 10240) || '...'
                ELSE array_col::text
              END AS array_col,int_col,bool_col from public.test_table order by test_table.id asc nulls first limit 100 offset 0;"
      `)
    })

    it('should handle array-based enum columns by adding ::text cast', () => {
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
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(enum_array::text) > 10240 
                THEN left(enum_array::text, 10240) || '...'
                ELSE enum_array::text
              END AS enum_array,CASE
                WHEN octet_length(regular_array::text) > 10240 
                THEN left(regular_array::text, 10240) || '...'
                ELSE regular_array::text
              END AS regular_array from public.test_table order by test_table.id asc nulls first limit 100 offset 0;"
      `)
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
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(vector_col::text) > 10240 
                THEN left(vector_col::text, 10240) || '...'
                ELSE vector_col::text
              END AS vector_col,CASE
                WHEN octet_length(geometry_col::text) > 10240 
                THEN left(geometry_col::text, 10240) || '...'
                ELSE geometry_col::text
              END AS geometry_col,CASE
                WHEN octet_length(tsvector_col::text) > 10240 
                THEN left(tsvector_col::text, 10240) || '...'
                ELSE tsvector_col::text
              END AS tsvector_col,CASE
                WHEN octet_length(range_col::text) > 10240 
                THEN left(range_col::text, 10240) || '...'
                ELSE range_col::text
              END AS range_col,int_col from public.test_table order by test_table.id asc nulls first limit 100 offset 0;"
      `)
    })

    it('should handle extension-specific types like vector data', () => {
      const table = createTestTable([
        { name: 'id', format: 'int8', isPrimaryKey: true, dataType: 'bigint' },
        { name: 'embedding', format: 'user-defined', dataType: 'vector' },
        { name: 'geometry_data', format: 'user-defined', dataType: 'geometry' },
        { name: 'tsvector_data', format: 'user-defined', dataType: 'tsvector' },
      ])

      const sql = buildTableRowsQuery({ table: table as any })
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(embedding::text) > 10240 
                THEN left(embedding::text, 10240) || '...'
                ELSE embedding::text
              END AS embedding,CASE
                WHEN octet_length(geometry_data::text) > 10240 
                THEN left(geometry_data::text, 10240) || '...'
                ELSE geometry_data::text
              END AS geometry_data,CASE
                WHEN octet_length(tsvector_data::text) > 10240 
                THEN left(tsvector_data::text, 10240) || '...'
                ELSE tsvector_data::text
              END AS tsvector_data from public.test_table order by test_table.id asc nulls first limit 100 offset 0;"
      `)
    })
  })

  describe('Query customization', () => {
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
      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(name::text) > 10240 
                THEN left(name::text, 10240) || '...'
                ELSE name::text
              END AS name from public.test_table order by test_table.id asc nulls first limit 10 offset 10;"
      `)
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

      expect(sql).toMatchInlineSnapshot(`
        "select id,CASE
                WHEN octet_length(name::text) > 10240 
                THEN left(name::text, 10240) || '...'
                ELSE name::text
              END AS name from public.test_table order by test_table.name desc nulls last limit 100 offset 0;"
      `)
    })
  })
})
