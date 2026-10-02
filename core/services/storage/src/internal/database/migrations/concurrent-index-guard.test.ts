import { loadMigrationFiles } from 'postgres-migrations'
import type { BasicPgClient, Migration } from 'postgres-migrations/dist/types'
import { vi } from 'vitest'
import { repairInvalidConcurrentIndexes } from './concurrent-index-guard'

function createMigration(sql: string): Migration {
  return {
    id: 1,
    name: 'concurrent-index-test',
    fileName: '0001-concurrent-index-test.sql',
    hash: 'hash-1',
    contents: sql,
    sql,
  }
}

function createClient() {
  const query = vi.fn()

  return {
    client: { query } as unknown as BasicPgClient,
    query,
  }
}

describe('repairInvalidConcurrentIndexes', () => {
  it('fails closed when a concurrent index target cannot be parsed', async () => {
    const { client, query } = createClient()
    const migration = createMigration(
      'CREATE INDEX CONCURRENTLY ON storage.objects (bucket_id, name);'
    )

    await expect(repairInvalidConcurrentIndexes(client, migration)).rejects.toThrow(
      'Cannot determine the target of a concurrent index migration'
    )
    expect(query).not.toHaveBeenCalled()
  })

  it('fails closed when the name belongs to a non-index relation', async () => {
    const { client, query } = createClient()
    const migration = createMigration(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON storage.objects (name);'
    )
    query.mockResolvedValueOnce({
      rows: [
        {
          schema_name: 'storage',
          index_name: 'idx_objects_test',
          indisvalid: null,
          on_table: null,
        },
      ],
    })

    await expect(repairInvalidConcurrentIndexes(client, migration)).rejects.toThrow(
      'Cannot repair concurrent index idx_objects_test: its name is used by a different relation'
    )
    expect(query).toHaveBeenCalledOnce()
  })

  it('repairs quoted identifiers with spaces, punctuation, and embedded quotes', async () => {
    const { client, query } = createClient()
    const migration = createMigration(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX-$ objects ""test""" ON "storage schema" . "objects table" (name);'
    )
    query
      .mockResolvedValueOnce({
        rows: [
          {
            schema_name: 'storage schema',
            index_name: 'IDX-$ objects "test"',
            indisvalid: false,
            on_table: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([
      { schemaName: 'storage schema', indexName: 'IDX-$ objects "test"' },
    ])
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        values: ['"storage schema" . "objects table"', 'IDX-$ objects "test"'],
      })
    )
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DROP INDEX CONCURRENTLY IF EXISTS "storage schema"."IDX-$ objects ""test"""'
    )
  })

  it('does not drop anything when the target table does not resolve', async () => {
    const { client, query } = createClient()
    const migration = createMigration(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON missing.objects (name);'
    )
    query.mockResolvedValueOnce({ rows: [] })

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([])
    expect(query).toHaveBeenCalledOnce()
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['missing.objects', 'idx_objects_test'],
      })
    )
  })

  it('guards a concurrent create that does not start a line', async () => {
    const { client, query } = createClient()
    const migration = createMigration(
      'SELECT 1; CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON storage.objects (name);'
    )
    query
      .mockResolvedValueOnce({
        rows: [
          {
            schema_name: 'storage',
            index_name: 'idx_objects_test',
            indisvalid: false,
            on_table: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([
      { schemaName: 'storage', indexName: 'idx_objects_test' },
    ])
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DROP INDEX CONCURRENTLY IF EXISTS "storage"."idx_objects_test"'
    )
  })

  it('ignores concurrent creates inside comments', async () => {
    const { client, query } = createClient()
    const migration = createMigration(`/*
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON storage.objects (name);
*/
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON storage.objects (name);
SELECT 1;`)

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([])
    expect(query).not.toHaveBeenCalled()
  })

  it('ignores concurrent creates inside strings and dollar quotes', async () => {
    const { client, query } = createClient()
    const migration = createMigration(`
SELECT 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_single ON storage.objects (name)';
SELECT 'quoted ''CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubled ON storage.objects (name)'' text';
SELECT E'escaped \\' CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escape ON storage.objects (name)';
SELECT $$CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empty_tag ON storage.objects (name)$$;
SELECT $body$CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dollar ON storage.objects (name)$body$;`)

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([])
    expect(query).not.toHaveBeenCalled()
  })

  it('finds a concurrent create after comment markers inside strings', async () => {
    const { client, query } = createClient()
    const migration = createMigration(`
SELECT '-- not a comment', '/* not a comment */';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON storage.objects (name);`)
    query
      .mockResolvedValueOnce({
        rows: [
          {
            schema_name: 'storage',
            index_name: 'idx_objects_test',
            indisvalid: false,
            on_table: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([
      { schemaName: 'storage', indexName: 'idx_objects_test' },
    ])
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DROP INDEX CONCURRENTLY IF EXISTS "storage"."idx_objects_test"'
    )
  })

  it('ignores nested block comments and finds the following concurrent create', async () => {
    const { client, query } = createClient()
    const migration = createMigration(`
/* outer comment
  /* nested comment */
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commented_out ON storage.objects (name);
*/
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test ON storage.objects (name);`)
    query
      .mockResolvedValueOnce({
        rows: [
          {
            schema_name: 'storage',
            index_name: 'idx_objects_test',
            indisvalid: false,
            on_table: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([
      { schemaName: 'storage', indexName: 'idx_objects_test' },
    ])
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        values: ['storage.objects', 'idx_objects_test'],
      })
    )
  })

  it('ignores DROP INDEX CONCURRENTLY', async () => {
    const { client, query } = createClient()
    const migration = createMigration('DROP INDEX CONCURRENTLY IF EXISTS idx_objects_test;')

    await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toEqual([])
    expect(query).not.toHaveBeenCalled()
  })

  it('handles every checked-in tenant migration', async () => {
    const { client, query } = createClient()
    const migrations = await loadMigrationFiles('./migrations/tenant')
    query.mockResolvedValue({ rows: [] })

    for (const migration of migrations) {
      await expect(repairInvalidConcurrentIndexes(client, migration)).resolves.toBeDefined()
    }

    // Migration 65 generates its statement; the runner tests cover its resolved SQL.
    expect(query).toHaveBeenCalledTimes(8)
  })
})
