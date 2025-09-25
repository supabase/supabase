import { describe, it, expect } from 'vitest'
import {
  detectActivationFromSql,
  getSqlToAnalyze,
  type ActivationDetection,
} from './telemetry-sql-parser'

describe('getSqlToAnalyze', () => {
  it('returns selection when provided', () => {
    const fullSql = 'SELECT * FROM users; CREATE TABLE posts (id int);'
    const selection = 'CREATE TABLE posts (id int);'
    const result = getSqlToAnalyze(fullSql, selection)
    expect(result).toBe('CREATE TABLE posts (id int);')
  })

  it('returns full SQL when no selection provided', () => {
    const fullSql = 'CREATE TABLE users (id int);'
    const result = getSqlToAnalyze(fullSql)
    expect(result).toBe('CREATE TABLE users (id int);')
  })

  it('trims whitespace from selection', () => {
    const fullSql = 'SELECT * FROM users;'
    const selection = '  CREATE TABLE posts (id int);  '
    const result = getSqlToAnalyze(fullSql, selection)
    expect(result).toBe('CREATE TABLE posts (id int);')
  })

  it('returns full SQL when selection is empty', () => {
    const fullSql = 'CREATE TABLE users (id int);'
    const selection = '   '
    const result = getSqlToAnalyze(fullSql, selection)
    expect(result).toBe('CREATE TABLE users (id int);')
  })
})

describe('detectActivationFromSql - CREATE TABLE', () => {
  it('detects simple CREATE TABLE', () => {
    const sql = 'CREATE TABLE users (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects CREATE TABLE with schema', () => {
    const sql = 'CREATE TABLE myschema.users (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'myschema',
      tableName: 'users',
    })
  })

  it('detects CREATE TABLE IF NOT EXISTS', () => {
    const sql = 'CREATE TABLE IF NOT EXISTS users (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects CREATE TABLE IF NOT EXISTS with schema', () => {
    const sql = 'CREATE TABLE IF NOT EXISTS myschema.users (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'myschema',
      tableName: 'users',
    })
  })

  it('handles CREATE TABLE with mixed case', () => {
    const sql = 'create table Users (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'Users',
    })
  })
})

describe('detectActivationFromSql - INSERT', () => {
  it('detects INSERT with single row', () => {
    const sql = 'INSERT INTO users (id, name) VALUES (1, \'John\');'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('detects INSERT with multiple rows', () => {
    const sql = 'INSERT INTO users (id, name) VALUES (1, \'John\'), (2, \'Jane\'), (3, \'Bob\');'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'users',
      estimatedRowCount: 3,
    })
  })

  it('detects INSERT with schema-qualified table', () => {
    const sql = 'INSERT INTO myschema.users (id, name) VALUES (1, \'John\');'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'myschema',
      tableName: 'users',
      estimatedRowCount: 1,
    })
  })

  it('handles INSERT with mixed case', () => {
    const sql = 'insert into Users (id, name) values (1, \'John\');'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'data_inserted',
      schema: 'public',
      tableName: 'Users',
      estimatedRowCount: 1,
    })
  })
})

describe('detectActivationFromSql - RLS', () => {
  it('detects ALTER TABLE ENABLE ROW LEVEL SECURITY', () => {
    const sql = 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'rls_enabled',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('detects RLS with schema-qualified table', () => {
    const sql = 'ALTER TABLE myschema.users ENABLE ROW LEVEL SECURITY;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'rls_enabled',
      schema: 'myschema',
      tableName: 'users',
    })
  })

  it('handles RLS with mixed case', () => {
    const sql = 'alter table Users enable row level security;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'rls_enabled',
      schema: 'public',
      tableName: 'Users',
    })
  })
})

describe('detectActivationFromSql - Multiple Statements', () => {
  it('detects multiple statements separated by semicolons', () => {
    const sql = `
      CREATE TABLE users (id int);
      INSERT INTO users VALUES (1);
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    `
    const result = detectActivationFromSql(sql)
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

  it('detects multiple CREATE TABLE statements', () => {
    const sql = `
      CREATE TABLE users (id int);
      CREATE TABLE posts (id int);
    `
    const result = detectActivationFromSql(sql)
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

  it('handles statements with different schemas', () => {
    const sql = `
      CREATE TABLE public.users (id int);
      INSERT INTO auth.users VALUES (1);
      ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
    `
    const result = detectActivationFromSql(sql)
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
})

describe('detectActivationFromSql - Comments Handling', () => {
  it('strips single-line comments', () => {
    const sql = `
      -- This is a comment
      CREATE TABLE users (id int);
      -- Another comment
    `
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('strips multi-line comments', () => {
    const sql = `
      /* This is a
         multi-line comment */
      CREATE TABLE users (id int);
    `
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })

  it('handles inline comments', () => {
    const sql = 'CREATE TABLE users (id int); -- inline comment'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users',
    })
  })
})

describe('detectActivationFromSql - Edge Cases', () => {
  it('returns empty array for empty SQL', () => {
    const sql = ''
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for whitespace-only SQL', () => {
    const sql = '   \n  \t  '
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for SELECT statements', () => {
    const sql = 'SELECT * FROM users;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for UPDATE statements', () => {
    const sql = 'UPDATE users SET name = \'John\' WHERE id = 1;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('returns empty array for DELETE statements', () => {
    const sql = 'DELETE FROM users WHERE id = 1;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('handles SQL with only comments', () => {
    const sql = `
      -- Just a comment
      /* Another comment */
    `
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(0)
  })

  it('handles trailing semicolons', () => {
    const sql = 'CREATE TABLE users (id int);;'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
  })

  it('handles table names with underscores', () => {
    const sql = 'CREATE TABLE user_profiles (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'user_profiles',
    })
  })

  it('handles table names with numbers', () => {
    const sql = 'CREATE TABLE users2 (id int);'
    const result = detectActivationFromSql(sql)
    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]).toEqual({
      type: 'table_created',
      schema: 'public',
      tableName: 'users2',
    })
  })
})