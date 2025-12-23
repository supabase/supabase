import { describe, test, expect } from 'vitest'
import {
  splitSqlStatements,
  isExplainQuery,
  isExplainSql,
  formatNodeDuration,
} from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'

describe('isExplainQuery', () => {
  test('returns true for valid EXPLAIN result rows', () => {
    const rows = [{ 'QUERY PLAN': 'Seq Scan on users' }]
    expect(isExplainQuery(rows)).toBe(true)
  })

  test('returns false for empty array', () => {
    expect(isExplainQuery([])).toBe(false)
  })

  test('returns false for regular query results', () => {
    const rows = [{ id: 1, name: 'John' }]
    expect(isExplainQuery(rows)).toBe(false)
  })
})

describe('isExplainSql', () => {
  test('returns true for EXPLAIN queries', () => {
    expect(isExplainSql('EXPLAIN SELECT * FROM users')).toBe(true)
    expect(isExplainSql('explain analyze SELECT * FROM users')).toBe(true)
    expect(isExplainSql('  EXPLAIN SELECT 1')).toBe(true)
  })

  test('returns false for non-EXPLAIN queries', () => {
    expect(isExplainSql('SELECT * FROM users')).toBe(false)
    expect(isExplainSql('INSERT INTO users VALUES (1)')).toBe(false)
  })
})

describe('formatNodeDuration', () => {
  test('returns "-" for undefined', () => {
    expect(formatNodeDuration(undefined)).toBe('-')
  })

  test('formats seconds for large values', () => {
    expect(formatNodeDuration(1500)).toBe('1.50s')
  })

  test('formats milliseconds for medium values', () => {
    expect(formatNodeDuration(25.5)).toBe('25.50ms')
  })

  test('formats microseconds for small values', () => {
    expect(formatNodeDuration(0.0005)).toBe('0.5µs')
  })
})

describe('splitSqlStatements', () => {
  test('splits multiple statements by semicolon', () => {
    const sql = 'SELECT * FROM users; SELECT * FROM orders;'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT * FROM users')
    expect(result[1]).toBe('SELECT * FROM orders')
  })

  test('handles single statement', () => {
    const sql = 'SELECT * FROM users'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe('SELECT * FROM users')
  })

  test('ignores semicolons inside single quotes', () => {
    const sql = "SELECT * FROM users WHERE name = 'foo;bar'; SELECT 1"
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe("SELECT * FROM users WHERE name = 'foo;bar'")
  })

  test('ignores semicolons inside dollar quotes', () => {
    const sql = 'SELECT $$ text with ; semicolon $$; SELECT 1'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT $$ text with ; semicolon $$')
  })

  test('returns empty array for empty input', () => {
    expect(splitSqlStatements('')).toHaveLength(0)
    expect(splitSqlStatements('   ')).toHaveLength(0)
  })
})
