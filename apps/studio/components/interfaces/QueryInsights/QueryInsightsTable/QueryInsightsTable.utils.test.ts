import { describe, it, expect } from 'vitest'
import {
  formatDuration,
  getQueryType,
  getTableName,
  getColumnName,
  formatQueryDisplay,
} from './QueryInsightsTable.utils'

describe('formatDuration', () => {
  it('returns ms for values under 1000', () => {
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('delegates to formatDurationLong for values >= 1000', () => {
    expect(formatDuration(1000)).toBe('1.00s')
    expect(formatDuration(60000)).toBe('1m')
  })
})

describe('getQueryType', () => {
  it('returns null for empty/null/undefined input', () => {
    expect(getQueryType(null)).toBeNull()
    expect(getQueryType(undefined)).toBeNull()
    expect(getQueryType('')).toBeNull()
  })

  it('returns the SQL keyword for standard statement types', () => {
    expect(getQueryType('SELECT * FROM users')).toBe('SELECT')
    expect(getQueryType('INSERT INTO orders VALUES (1)')).toBe('INSERT')
    expect(getQueryType('UPDATE users SET name = $1')).toBe('UPDATE')
    expect(getQueryType('DELETE FROM logs')).toBe('DELETE')
    expect(getQueryType('CREATE TABLE foo (id int)')).toBe('CREATE')
    expect(getQueryType('DROP TABLE foo')).toBe('DROP')
    expect(getQueryType('ALTER TABLE foo ADD COLUMN bar text')).toBe('ALTER')
    expect(getQueryType('TRUNCATE foo')).toBe('TRUNCATE')
  })

  it('returns WITH for simple CTEs', () => {
    expect(getQueryType('WITH cte AS (SELECT 1) SELECT * FROM cte')).toBe('WITH')
  })

  it('is case-insensitive', () => {
    expect(getQueryType('select * from users')).toBe('SELECT')
    expect(getQueryType('insert into foo values (1)')).toBe('INSERT')
  })
})

describe('getTableName', () => {
  it('returns null for empty/null/undefined input', () => {
    expect(getTableName(null)).toBeNull()
    expect(getTableName(undefined)).toBeNull()
    expect(getTableName('')).toBeNull()
  })

  it('extracts table from SELECT FROM', () => {
    expect(getTableName('SELECT * FROM users')).toBe('users')
    expect(getTableName('SELECT id FROM public.orders WHERE id = 1')).toBe('orders')
  })

  it('extracts table from INSERT INTO', () => {
    expect(getTableName('INSERT INTO orders (id) VALUES (1)')).toBe('orders')
  })

  it('extracts table from UPDATE', () => {
    expect(getTableName('UPDATE users SET name = $1 WHERE id = 1')).toBe('users')
  })

  it('extracts table from DELETE FROM', () => {
    expect(getTableName('DELETE FROM logs WHERE id = 1')).toBe('logs')
  })

  it('extracts table from CREATE TABLE', () => {
    expect(getTableName('CREATE TABLE foo (id int)')).toBe('foo')
    expect(getTableName('CREATE TABLE IF NOT EXISTS bar (id int)')).toBe('bar')
  })

  it('extracts table from ALTER TABLE', () => {
    expect(getTableName('ALTER TABLE users ADD COLUMN email text')).toBe('users')
  })

  it('extracts table from DROP TABLE', () => {
    expect(getTableName('DROP TABLE IF EXISTS old_table')).toBe('old_table')
  })

  it('extracts table from TRUNCATE', () => {
    expect(getTableName('TRUNCATE TABLE logs')).toBe('logs')
    expect(getTableName('TRUNCATE logs')).toBe('logs')
  })

  it('strips schema prefix', () => {
    expect(getTableName('SELECT * FROM public.users')).toBe('users')
  })

  it('strips quotes', () => {
    expect(getTableName('SELECT * FROM "my_table"')).toBe('my_table')
  })
})

describe('getColumnName', () => {
  it('returns null for empty/null/undefined input', () => {
    expect(getColumnName(null)).toBeNull()
    expect(getColumnName(undefined)).toBeNull()
    expect(getColumnName('')).toBeNull()
  })

  it('extracts column from WHERE clause', () => {
    expect(getColumnName('SELECT * FROM users WHERE id = 1')).toBe('id')
  })

  it('extracts column from ORDER BY when no WHERE clause', () => {
    expect(getColumnName('SELECT * FROM users ORDER BY created_at')).toBe('created_at')
  })

  it('extracts column from GROUP BY', () => {
    expect(getColumnName('SELECT status, count(*) FROM orders GROUP BY status')).toBe('status')
  })

  it('extracts column from UPDATE SET when no WHERE clause', () => {
    expect(getColumnName('UPDATE users SET email = $1')).toBe('email')
  })

  it('extracts first column from INSERT INTO', () => {
    expect(getColumnName('INSERT INTO users (id, name) VALUES ($1, $2)')).toBe('id')
  })
})

describe('formatQueryDisplay', () => {
  it('formats all three parts', () => {
    expect(formatQueryDisplay('SELECT', 'users', 'id')).toBe('SELECT in users, id')
  })

  it('uses dash placeholders for null values', () => {
    expect(formatQueryDisplay(null, null, null)).toBe('– in –, –')
    expect(formatQueryDisplay('SELECT', null, null)).toBe('SELECT in –, –')
  })
})
