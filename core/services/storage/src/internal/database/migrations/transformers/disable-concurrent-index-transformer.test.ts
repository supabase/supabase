import { DisableConcurrentIndexTransformer } from '@internal/database/migrations/transformers'

describe('DisableConcurrentIndexTransformer', () => {
  const transformer = new DisableConcurrentIndexTransformer()

  it('should replace INDEX CONCURRENTLY with INDEX', () => {
    const migration = {
      id: 1,
      name: 'test-migration',
      hash: 'abc123',
      sql: 'CREATE INDEX CONCURRENTLY idx_name ON table (column);',
      contents: 'CREATE INDEX CONCURRENTLY idx_name ON table (column);',
      fileName: 'test.sql',
    }

    const result = transformer.transform(migration)

    expect(result.sql).toBe('CREATE INDEX idx_name ON table (column);')
    expect(result.contents).toBe('CREATE INDEX idx_name ON table (column);')
    expect(result.id).toBe(1)
    expect(result.name).toBe('test-migration')
    expect(result.hash).toBe('abc123')
  })

  it('should remove disable-transaction directive', () => {
    const migration = {
      id: 2,
      name: 'test-migration-2',
      hash: 'def456',
      sql: '-- postgres-migrations disable-transaction\nCREATE INDEX CONCURRENTLY idx_name ON table (column);',
      contents:
        '-- postgres-migrations disable-transaction\nCREATE INDEX CONCURRENTLY idx_name ON table (column);',
      fileName: 'test2.sql',
    }

    const result = transformer.transform(migration)

    expect(result.sql).toBe('\nCREATE INDEX idx_name ON table (column);')
    expect(result.contents).toBe('\nCREATE INDEX idx_name ON table (column);')
  })

  it('should handle migrations without CONCURRENTLY (no-op)', () => {
    const migration = {
      id: 3,
      name: 'test-migration-3',
      hash: 'ghi789',
      sql: 'CREATE TABLE test_table (id SERIAL PRIMARY KEY);',
      contents: 'CREATE TABLE test_table (id SERIAL PRIMARY KEY);',
      fileName: 'test3.sql',
    }

    const result = transformer.transform(migration)

    expect(result).toEqual(migration)
  })

  it('should handle multiple CONCURRENTLY occurrences', () => {
    const migration = {
      id: 4,
      name: 'test-migration-4',
      hash: 'jkl012',
      sql: 'CREATE INDEX CONCURRENTLY idx1 ON table1 (col1);\nCREATE INDEX CONCURRENTLY idx2 ON table2 (col2);',
      contents:
        'CREATE INDEX CONCURRENTLY idx1 ON table1 (col1);\nCREATE INDEX CONCURRENTLY idx2 ON table2 (col2);',
      fileName: 'test4.sql',
    }

    const result = transformer.transform(migration)

    expect(result.sql).toBe(
      'CREATE INDEX idx1 ON table1 (col1);\nCREATE INDEX idx2 ON table2 (col2);'
    )
    expect(result.contents).toBe(
      'CREATE INDEX idx1 ON table1 (col1);\nCREATE INDEX idx2 ON table2 (col2);'
    )
  })

  it('should preserve migration structure', () => {
    const migration = {
      id: 5,
      name: 'complex-migration',
      hash: 'mno345',
      sql: 'CREATE INDEX CONCURRENTLY idx_name ON table (column);',
      contents: 'CREATE INDEX CONCURRENTLY idx_name ON table (column);',
      fileName: 'complex.sql',
    }

    const result = transformer.transform(migration)

    expect(result.id).toBe(migration.id)
    expect(result.name).toBe(migration.name)
    expect(result.hash).toBe(migration.hash)
    expect(result.fileName).toBe(migration.fileName)
  })

  it('should handle edge cases (empty sql, no matches)', () => {
    const migration = {
      id: 6,
      name: 'empty-migration',
      hash: 'pqr678',
      sql: '',
      contents: '',
      fileName: 'empty.sql',
    }

    const result = transformer.transform(migration)

    expect(result).toEqual(migration)
  })
})
