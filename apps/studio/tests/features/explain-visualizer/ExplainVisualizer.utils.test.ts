import { describe, test, expect } from 'vitest'
import {
  splitSqlStatements,
  isExplainQuery,
  isExplainSql,
  isTextFormatExplain,
  formatNodeDuration,
} from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'

describe('isExplainQuery', () => {
  test('returns true for valid EXPLAIN result rows', () => {
    const rows = [{ 'QUERY PLAN': 'Seq Scan on users' }]
    expect(isExplainQuery(rows)).toBe(true)
  })

  test('returns true for JSON format EXPLAIN result rows', () => {
    // JSON format returns an array/object in the QUERY PLAN column
    const rows = [{ 'QUERY PLAN': [{ Plan: { 'Node Type': 'Seq Scan' } }] }]
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

describe('isTextFormatExplain', () => {
  test('returns true for TEXT format EXPLAIN result rows', () => {
    const rows = [
      { 'QUERY PLAN': 'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36)' },
      { 'QUERY PLAN': '  Filter: (active = true)' },
    ]
    expect(isTextFormatExplain(rows)).toBe(true)
  })

  test('returns false for JSON format EXPLAIN result rows', () => {
    const rows = [
      { 'QUERY PLAN': [{ Plan: { 'Node Type': 'Seq Scan', 'Relation Name': 'users' } }] },
    ]
    expect(isTextFormatExplain(rows)).toBe(false)
  })

  test('returns true for YAML format EXPLAIN result rows (returned as string)', () => {
    const rows = [
      {
        'QUERY PLAN':
          '- Plan: \n    Node Type: "Seq Scan"\n    Parallel Aware: false\n    Async Capable: false\n    Relation Name: "orders"\n    Alias: "orders"\n    Startup Cost: 0.00\n    Total Cost: 97.00\n    Plan Rows: 5000\n    Plan Width: 41',
      },
    ]

    expect(isTextFormatExplain(rows)).toBe(true)
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

  test('ignores semicolons inside line comments', () => {
    const sql = 'SELECT * FROM users -- this is a comment; with semicolon'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe('SELECT * FROM users -- this is a comment; with semicolon')
  })

  test('treats semicolons after line comments as separators', () => {
    const sql = 'SELECT * FROM users -- comment\n; SELECT * FROM orders'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT * FROM users -- comment')
    expect(result[1]).toBe('SELECT * FROM orders')
  })

  test('ignores semicolons inside block comments', () => {
    const sql = `SELECT * FROM users /* single-line; comment */ WHERE id = 1;
SELECT * FROM orders
/* multi-line comment
   with semicolon; inside
   multiple lines */
WHERE status = 'active'`
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT * FROM users /* single-line; comment */ WHERE id = 1')
    expect(result[1]).toContain('/* multi-line comment')
    expect(result[1]).toContain('with semicolon; inside')
  })

  test('handles mixed line comments and real semicolons', () => {
    const sql = `SELECT * FROM users -- first query; fake semicolon
; SELECT * FROM orders -- another comment; fake
WHERE status = 'active';`
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toContain('SELECT * FROM users')
    expect(result[0]).toContain('-- first query; fake semicolon')
    expect(result[1]).toContain('SELECT * FROM orders')
    expect(result[1]).toContain("WHERE status = 'active'")
  })

  test('handles mixed block comments and real semicolons', () => {
    const sql = 'SELECT 1; /* comment; with semicolon */ SELECT 2;'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT 1')
    expect(result[1]).toBe('/* comment; with semicolon */ SELECT 2')
  })

  test('handles multiple consecutive line comments', () => {
    const sql = `-- Comment 1; with semicolon
-- Comment 2; another semicolon
SELECT * FROM users`
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(1)
    expect(result[0]).toContain('-- Comment 1; with semicolon')
    expect(result[0]).toContain('-- Comment 2; another semicolon')
    expect(result[0]).toContain('SELECT * FROM users')
  })

  test('handles comments at end of statement', () => {
    const sql = `SELECT * FROM users; -- end comment; with semicolon
SELECT * FROM orders /* block comment; */`
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT * FROM users')
    expect(result[1]).toContain('SELECT * FROM orders')
    expect(result[1]).toContain('/* block comment; */')
  })

  test('handles complex mix of strings, comments, and semicolons', () => {
    const sql = `-- Initial comment; with semicolon
SELECT 'string; with semicolon' FROM users /* block; comment */;
-- Next query
SELECT "quoted; identifier" FROM orders -- line; comment
WHERE data = $$ dollar; quote $$;`
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(2)
    expect(result[0]).toContain("SELECT 'string; with semicolon' FROM users")
    expect(result[0]).toContain('/* block; comment */')
    expect(result[1]).toContain('SELECT "quoted; identifier" FROM orders')
    expect(result[1]).toContain('$$ dollar; quote $$')
  })

  test('handles statement that is only a comment', () => {
    const sql = '-- Just a comment; with semicolon'
    const result = splitSqlStatements(sql)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe('-- Just a comment; with semicolon')
  })

  test('handles empty statements between semicolons', () => {
    const sql = 'SELECT 1;; SELECT 2'
    const result = splitSqlStatements(sql)

    // Empty statements are filtered out by trim()
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('SELECT 1')
    expect(result[1]).toBe('SELECT 2')
  })

  test('handles EXPLAIN queries with comments (single statement verification)', () => {
    const sql = `-- Query to analyze; note the semicolon
EXPLAIN ANALYZE
SELECT * FROM users
WHERE created_at > NOW() - INTERVAL '1 day' -- last 24 hours; active users`
    const result = splitSqlStatements(sql)

    // EXPLAIN only works with single statements - verify comments don't cause false splits
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('EXPLAIN ANALYZE')
  })
})
