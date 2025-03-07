import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabase, cleanupRoot } from './db/utils'
import { PGTable } from '../src/pg-meta-tables'
import { PGColumn } from '../src/pg-meta-columns'
import tableRowsQuery from '../src/pg-meta-table-rows-query'

/**
 * Tests for the table-rows-query module
 */
describe('table-rows-query', () => {
  let db: {
    dbName: string
    client: 'pg'
    executeQuery: <T = any>(query: string) => Promise<T>
    cleanup: () => Promise<void>
  }
  let memeTable: PGTable

  beforeAll(async () => {
    // Set up test database
    db = await createTestDatabase()

    // Create a test table
    await db.executeQuery(`
      CREATE TABLE memes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        description TEXT,
        metadata JSONB,
        views INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        rating FLOAT,
        uuid UUID DEFAULT gen_random_uuid(),
        tags TEXT[]
      );
      
      INSERT INTO memes (title, url, description, metadata, views, is_published, rating, tags)
      VALUES 
        ('Test Meme 1', 'http://example.com/1.jpg', 'Description 1', '{"tags": ["funny", "cat"]}', 100, true, 4.5, ARRAY['funny', 'cat']),
        ('Test Meme 2', 'http://example.com/2.jpg', 'Description 2', '{"tags": ["dog", "cute"]}', 50, true, 3.8, ARRAY['dog', 'cute']),
        ('Test Meme 3', 'http://example.com/3.jpg', 'Description 3', '{"tags": ["funny", "fail"]}', 200, true, 4.2, ARRAY['funny', 'fail']);
    `)

    // Get the table structure for testing
    const tableResult = await db.executeQuery<PGTable[]>(`
      SELECT 
        t.oid as id,
        n.nspname as schema,
        t.relname as name,
        false as rls_enabled,
        false as rls_forced,
        'DEFAULT' as replica_identity,
        pg_total_relation_size(format('%I.%I', n.nspname, t.relname)) as bytes,
        pg_size_pretty(pg_total_relation_size(format('%I.%I', n.nspname, t.relname))) as size,
        coalesce(reltuples::int, 0) as live_rows_estimate,
        0 as dead_rows_estimate,
        obj_description(t.oid, 'pg_class') as comment
      FROM pg_class t
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'memes' 
        AND t.relkind = 'r'
        AND n.nspname = 'public'
    `)

    if (tableResult.length === 0) {
      throw new Error('Test table not found')
    }

    memeTable = tableResult[0]

    // Get primary keys
    const pkResult = await db.executeQuery(`
      SELECT
        a.attname as name,
        'public' as schema,
        'memes' as table_name,
        ${memeTable.id} as table_id
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'public.memes'::regclass
        AND i.indisprimary
    `)

    memeTable.primary_keys = pkResult

    // Get columns
    type ColumnResult = {
      name: string
      data_type: string
      ordinal_position: number
      is_nullable: boolean
      default_value: string | null
      enums: string[]
      format: string
    }

    const columnsResult = await db.executeQuery<ColumnResult[]>(`
      SELECT
        a.attname as name,
        format_type(a.atttypid, a.atttypmod) as data_type,
        a.attnum as ordinal_position,
        NOT a.attnotnull as is_nullable,
        pg_get_expr(d.adbin, d.adrelid) as default_value,
        CASE 
          WHEN t.typtype = 'e' THEN ARRAY(
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = a.atttypid 
            ORDER BY enumsortorder
          )
          ELSE '{}'::text[]
        END as enums,
        CASE 
          WHEN t.typtype = 'd' THEN 'domain'
          WHEN t.typtype = 'e' THEN 'enum'
          WHEN t.typtype = 'r' THEN 'range'
          WHEN format_type(a.atttypid, NULL) = 'unknown' THEN 'base'
          WHEN format_type(a.atttypid, NULL) = 'user-defined' THEN 'user-defined'
          ELSE 'base'
        END as format
      FROM pg_attribute a
      JOIN pg_type t ON t.oid = a.atttypid
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = 'public.memes'::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `)

    memeTable.columns = columnsResult.map((col) => ({
      ...col,
      table: 'memes',
      schema: 'public',
      table_id: memeTable.id,
      id: `${memeTable.id}.${col.ordinal_position}`,
      is_identity: false,
      identity_generation: null,
      is_generated: false,
      is_updatable: true,
      is_unique: col.name === 'id',
      check: null,
      comment: null,
    })) as PGColumn[]

    // Add relationships array
    memeTable.relationships = []
  })

  afterAll(async () => {
    if (db) {
      await db.cleanup()
    }
    await cleanupRoot()
  })

  it('should correctly handle truncation of large text fields', () => {
    // Test query building with text fields that should be truncated
    const sql = tableRowsQuery.buildTableRowsQuery({
      table: memeTable,
    })

    // Basic validation
    expect(sql).toBeDefined()
    expect(sql).toContain('select')
    expect(sql).toContain('from')
    expect(sql).toContain('public.memes')

    // Verify truncation logic is applied correctly
    const textColumns =
      memeTable.columns?.filter(
        (col) => col.data_type.startsWith('text') || col.data_type.includes('json')
      ) || []

    for (const col of textColumns) {
      expect(sql).toContain(`CASE
        WHEN octet_length(${col.name}::text) > 10240 
        THEN left(${col.name}::text, 10240) || '...'
        ELSE ${col.name}::text
      END AS ${col.name}`)
    }

    // Verify numeric columns aren't truncated
    const numericColumns = memeTable.columns?.filter((col) => col.data_type.includes('int')) || []

    for (const col of numericColumns) {
      // Should be included as-is, not with truncation logic
      expect(sql.includes(`${col.name},`) || sql.includes(`${col.name} from`)).toBe(true)
      expect(sql).not.toContain(`${col.name}::text`)
    }
  })

  it('should handle pagination correctly', () => {
    const sql = tableRowsQuery.buildTableRowsQuery({
      table: memeTable,
      page: 2,
      limit: 10,
    })

    expect(sql).toContain('limit 10')
    expect(sql).toContain('offset 10')
  })

  it('should handle custom sorting when provided', () => {
    const sql = tableRowsQuery.buildTableRowsQuery({
      table: memeTable,
      sorts: [
        {
          column: 'id',
          table: 'memes',
          ascending: false,
          nullsFirst: false,
        },
      ],
    })

    expect(sql).toContain('order by memes.id desc nulls last')
  })

  it('should handle empty table case', () => {
    const sql = tableRowsQuery.buildTableRowsQuery({
      table: undefined as any,
    })

    expect(sql).toBe('')
  })

  describe('formatFilterValue', () => {
    it('should format string values with proper escaping', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'title',
            operator: '=',
            value: "O'Reilly's Book",
          },
        ],
      })

      // The single quote should be properly escaped
      expect(sql).toContain(`title = 'O''Reilly''s Book'`)
    })

    it('should format integer values without quotes', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'views',
            operator: '>',
            value: '50',
          },
        ],
      })

      // Integer should be unquoted
      expect(sql).toContain('views > 50')
    })

    it('should format boolean values correctly', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'is_published',
            operator: '=',
            value: 'true',
          },
        ],
      })

      // Boolean should be unquoted
      expect(sql).toContain('is_published = true')
    })

    it('should format float values correctly', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'rating',
            operator: '>=',
            value: '4.0',
          },
        ],
      })

      // Float should be unquoted
      expect(sql).toContain('rating >= 4')
    })

    it('should format JSON values correctly', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'metadata',
            operator: '@>',
            value: '{"tags": ["funny"]}',
          },
        ],
      })

      // JSON should be quoted and have the jsonb cast
      expect(sql).toContain(`metadata @> '{"tags":["funny"]}'::jsonb`)
    })

    it('should handle ILIKE operator with wildcards', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'title',
            operator: 'ILIKE',
            value: 'test',
          },
        ],
      })

      // ILIKE should add wildcards
      expect(sql).toContain(`title ILIKE '%test%'`)
    })

    it('should handle NULL values correctly', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'description',
            operator: 'IS',
            value: undefined,
          },
        ],
      })

      // NULL should be unquoted
      expect(sql).toContain(`description IS NULL`)
    })

    it('should handle timestamp values correctly', () => {
      const sql1 = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'created_at',
            operator: '>',
            value: '2023-01-01',
          },
        ],
      })

      // Timestamp should be quoted
      expect(sql1).toContain(`created_at > '2023-01-01'`)

      const sql2 = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'created_at',
            operator: '<',
            value: 'now()',
          },
        ],
      })

      // NOW() function should be unquoted
      expect(sql2).toContain(`created_at < NOW()`)
    })

    it('should handle UUID values correctly', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'uuid',
            operator: '=',
            value: '123e4567-e89b-12d3-a456-426614174000',
          },
        ],
      })

      // UUID should be quoted
      expect(sql).toContain(`uuid = '123e4567-e89b-12d3-a456-426614174000'`)
    })

    it('should handle invalid UUIDs by returning NULL', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'uuid',
            operator: '=',
            value: 'invalid-uuid',
          },
        ],
      })

      // Invalid UUID should be NULL
      expect(sql).toContain(`uuid = NULL`)
    })

    it('should handle array values correctly', () => {
      const sql = tableRowsQuery.buildTableRowsQuery({
        table: memeTable,
        filters: [
          {
            column: 'tags',
            operator: '@>',
            value: '{funny}',
          },
        ],
      })

      // Array should be quoted
      expect(sql).toContain(`tags @> '{funny}'`)
    })
  })
})
