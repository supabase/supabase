import { describe, it, expect } from 'vitest'
import {
  detectActivationFromSql,
  getSqlToAnalyze,
  type ActivationDetection,
} from './telemetry-sql-parser'

describe('getSqlToAnalyze', () => {
  it('returns selection when provided', async () => {
    const fullSql = 'SELECT * FROM users; CREATE TABLE posts (id int);'
    const selection = 'CREATE TABLE posts (id int);'
    const result = getSqlToAnalyze(fullSql, selection)
    expect(result).toBe('CREATE TABLE posts (id int);')
  })

  it('returns full SQL when no selection provided', async () => {
    const fullSql = 'CREATE TABLE users (id int);'
    const result = getSqlToAnalyze(fullSql)
    expect(result).toBe('CREATE TABLE users (id int);')
  })

  it('trims whitespace from selection', async () => {
    const fullSql = 'SELECT * FROM users;'
    const selection = '  CREATE TABLE posts (id int);  '
    const result = getSqlToAnalyze(fullSql, selection)
    expect(result).toBe('CREATE TABLE posts (id int);')
  })

  it('returns full SQL when selection is empty', async () => {
    const fullSql = 'CREATE TABLE users (id int);'
    const selection = '   '
    const result = getSqlToAnalyze(fullSql, selection)
    expect(result).toBe('CREATE TABLE users (id int);')
  })
})

describe('detectActivationFromSql - CREATE TABLE', () => {
  it('detects simple CREATE TABLE', async () => {
    const sql = 'CREATE TABLE users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects CREATE TABLE with schema', async () => {
    const sql = 'CREATE TABLE myschema.users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'myschema',
      tableName: 'users',
    })
  })

  it('detects CREATE TABLE IF NOT EXISTS', async () => {
    const sql = 'CREATE TABLE IF NOT EXISTS users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects CREATE TABLE IF NOT EXISTS with schema', async () => {
    const sql = 'CREATE TABLE IF NOT EXISTS myschema.users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'myschema',
      tableName: 'users',
    })
  })

  it('handles CREATE TABLE with mixed case', async () => {
    const sql = 'create table Users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users', // PostgreSQL lowercases unquoted identifiers
    })
  })

  it('detects CREATE TEMP TABLE', async () => {
    const sql = 'CREATE TEMP TABLE temp_users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'temp_users',
    })
  })

  it('detects CREATE TEMPORARY TABLE', async () => {
    const sql = 'CREATE TEMPORARY TABLE temp_users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'temp_users',
    })
  })

  it('detects CREATE UNLOGGED TABLE', async () => {
    const sql = 'CREATE UNLOGGED TABLE unlogged_users (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'unlogged_users',
    })
  })

  it('detects CREATE TABLE AS SELECT', async () => {
    const sql = 'CREATE TABLE new_users AS SELECT * FROM old_users;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'new_users',
    })
  })
})

describe('detectActivationFromSql - Quoted Identifiers', () => {
  it('handles quoted table names', async () => {
    const sql = 'CREATE TABLE "my-table" (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'my-table',
    })
  })

  it('handles quoted table names with spaces', async () => {
    const sql = 'CREATE TABLE "Table Name" (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'Table Name',
    })
  })

  it('handles quoted table names starting with number', async () => {
    const sql = 'CREATE TABLE "123table" (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: '123table',
    })
  })

  it('handles quoted reserved keywords as names', async () => {
    const sql = 'CREATE TABLE "select" (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'select',
    })
  })

  it('handles quoted schema with dots', async () => {
    const sql = 'CREATE TABLE "schema.with.dots"."table" (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'schema.with.dots',
      tableName: 'table',
    })
  })

  it('handles mixed quoted and unquoted identifiers', async () => {
    const sql = 'CREATE TABLE myschema."table" (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'myschema',
      tableName: 'table',
    })
  })
})

describe('detectActivationFromSql - INSERT', () => {
  it('detects INSERT with single row', async () => {
    const sql = "INSERT INTO users (id, name) VALUES (1, 'John');"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('detects INSERT with multiple rows', async () => {
    const sql = "INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane'), (3, 'Bob');"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 3,
    })
  })

  it('detects INSERT with schema-qualified table', async () => {
    const sql = "INSERT INTO myschema.users (id, name) VALUES (1, 'John');"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'myschema',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('handles INSERT with mixed case', async () => {
    const sql = "insert into Users (id, name) values (1, 'John');"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users', // PostgreSQL lowercases unquoted identifiers
      estimatedRowCount: 1,
    })
  })

  it('handles INSERT ... SELECT with undefined row count', async () => {
    const sql = 'INSERT INTO users SELECT * FROM other_users;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: undefined, // Can't determine row count for INSERT SELECT
    })
  })

  it('handles INSERT ... DEFAULT VALUES', async () => {
    const sql = 'INSERT INTO users DEFAULT VALUES;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('handles INSERT with ON CONFLICT', async () => {
    const sql = "INSERT INTO users (id, name) VALUES (1, 'John') ON CONFLICT (id) DO NOTHING;"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('handles INSERT with nested functions', async () => {
    const sql = "INSERT INTO users (id, name, created_at) VALUES (1, 'John', NOW()), (2, 'Jane', CURRENT_TIMESTAMP);"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 2,
    })
  })
})

describe('detectActivationFromSql - RLS', () => {
  it('detects ALTER TABLE ENABLE ROW LEVEL SECURITY', async () => {
    const sql = 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'rls_enabled',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects RLS with schema-qualified table', async () => {
    const sql = 'ALTER TABLE myschema.users ENABLE ROW LEVEL SECURITY;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'rls_enabled',
      schema: 'myschema',
      tableName: 'users',
    })
  })

  it('handles RLS with mixed case', async () => {
    const sql = 'alter table Users enable row level security;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'rls_enabled',
      schema: 'public',
      tableName: 'users', // PostgreSQL lowercases unquoted identifiers
    })
  })
})

describe('detectActivationFromSql - Multiple Statements', () => {
  it('detects multiple statements separated by semicolons', async () => {
    const sql = `
      CREATE TABLE users (id int);
      INSERT INTO users VALUES (1);
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(3)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
    expect(result.detections[1]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 1,
    })
    expect(result.detections[2]).toEqual({
      type: 'rls_enabled',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects multiple CREATE TABLE statements', async () => {
    const sql = `
      CREATE TABLE users (id int);
      CREATE TABLE posts (id int);
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(2)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
    expect(result.detections[1]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'posts',
    })
  })

  it('handles statements with different schemas', async () => {
    const sql = `
      CREATE TABLE public.users (id int);
      INSERT INTO auth.users VALUES (1);
      ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(3)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
    expect(result.detections[1]).toEqual({
      type: 'data_inserted',
      schema: 'auth',
      tableName: 'users',
      estimatedRowCount: 1,
    })
    expect(result.detections[2]).toEqual({
      type: 'rls_enabled',
      schema: 'storage',
      tableName: 'buckets',
    })
  })

  it('handles semicolons in string literals correctly', async () => {
    const sql = "CREATE TABLE users (id int, description text DEFAULT 'Hello; World');"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('handles semicolons in dollar-quoted strings', async () => {
    const sql = `
      CREATE TABLE users (id int);
      CREATE FUNCTION test() RETURNS void AS $$
        BEGIN
          SELECT 1; SELECT 2;
        END;
      $$ LANGUAGE plpgsql;
    `
    const result = await detectActivationFromSql(sql)
    // Should only detect the CREATE TABLE, not the statements inside the function
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })
})

describe('detectActivationFromSql - Comments Handling', () => {
  it('strips single-line comments', async () => {
    const sql = `
      -- This is a comment
      CREATE TABLE users (id int);
      -- Another comment
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('strips multi-line comments', async () => {
    const sql = `
      /* This is a
         multi-line comment */
      CREATE TABLE users (id int);
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('handles inline comments', async () => {
    const sql = 'CREATE TABLE users (id int); -- inline comment'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('handles nested comments correctly', async () => {
    const sql = `
      /* outer /* nested */ comment */
      CREATE TABLE users (id int);
    `
    const result = await detectActivationFromSql(sql)
    // Note: The existing removeCommentsFromSql doesn't handle nested comments perfectly
    // But it should still work for most cases
    expect(result.detections).toHaveLength(1)
  })
})

describe('detectActivationFromSql - Edge Cases', () => {
  it('returns empty array for empty SQL', async () => {
    const sql = ''
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for whitespace-only SQL', async () => {
    const sql = '   \n  \t  '
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for null input', async () => {
    const result = await detectActivationFromSql(null as any)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for undefined input', async () => {
    const result = await detectActivationFromSql(undefined as any)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for non-string input', async () => {
    const result = await detectActivationFromSql(123 as any)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for SQL exceeding MAX_SQL_LENGTH', async () => {
    const longSql = 'CREATE TABLE users (id int);'.padEnd(10_485_761, ' ')
    const result = await detectActivationFromSql(longSql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for SELECT statements', async () => {
    const sql = 'SELECT * FROM users;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for UPDATE statements', async () => {
    const sql = "UPDATE users SET name = 'John' WHERE id = 1;"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for DELETE statements', async () => {
    const sql = 'DELETE FROM users WHERE id = 1;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('handles SQL with only comments', async () => {
    const sql = `
      -- Just a comment
      /* Another comment */
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('handles trailing semicolons', async () => {
    const sql = 'CREATE TABLE users (id int);;'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
  })

  it('handles table names with underscores', async () => {
    const sql = 'CREATE TABLE user_profiles (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'user_profiles',
    })
  })

  it('handles table names with numbers', async () => {
    const sql = 'CREATE TABLE users2 (id int);'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users2',
    })
  })

  it('handles malformed SQL gracefully', async () => {
    const sql = 'CREATE TABLE'
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('handles SQL with syntax errors gracefully', async () => {
    const sql = 'CREATE TABEL users (id int);' // Typo: TABEL instead of TABLE
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('handles nested parentheses in INSERT VALUES', async () => {
    const sql = "INSERT INTO users (id, data) VALUES (1, '(nested (value))');"
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('handles complex nested structures', async () => {
    const sql = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        data JSONB DEFAULT '{"key": "value; with semicolon"}'::jsonb,
        CHECK (id > 0)
      );
      INSERT INTO users (data) VALUES ('{"nested": {"value": "data"}}');
    `
    const result = await detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(2)
    expect(result.detections[0].type).toBe('table_created')
    expect(result.detections[1].type).toBe('data_inserted')
  })
})