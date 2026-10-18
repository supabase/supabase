import { safeSql } from '@supabase/pg-meta'
import { describe, expect, it, test } from 'vitest'

import { applyAutoLimit, getSqlErrorLines, trimTrailingSemicolons } from '../utils'

describe('getSqlErrorLines', () => {
  it('returns formattedError lines when present', () => {
    const lines = getSqlErrorLines({
      message: 'permission denied for table users',
      formattedError:
        'ERROR:  42501: permission denied for table users\n' +
        'HINT:  To grant access to anon on a specific table:\n' +
        '  GRANT SELECT ON TABLE public.users TO anon;',
    })

    expect(lines).toEqual([
      'ERROR:  42501: permission denied for table users',
      'HINT:  To grant access to anon on a specific table:',
      '  GRANT SELECT ON TABLE public.users TO anon;',
    ])
  })

  it('strips empty lines from formattedError', () => {
    const lines = getSqlErrorLines({
      formattedError: 'ERROR: boom\n\nHINT: retry\n',
    })

    expect(lines).toEqual(['ERROR: boom', 'HINT: retry'])
  })

  it('falls back to message lines when formattedError is missing and message is multi-line', () => {
    const lines = getSqlErrorLines({
      message:
        'ERROR:  42501: permission denied for table users\n' +
        'HINT:  To grant access to anon on a specific table:\n' +
        '  GRANT SELECT ON TABLE public.users TO anon;',
    })

    expect(lines).toEqual([
      'ERROR:  42501: permission denied for table users',
      'HINT:  To grant access to anon on a specific table:',
      '  GRANT SELECT ON TABLE public.users TO anon;',
    ])
  })

  it('returns empty array for a single-line message so callers render the fallback', () => {
    const lines = getSqlErrorLines({ message: 'permission denied for table users' })
    expect(lines).toEqual([])
  })

  it('returns empty array when both fields are missing', () => {
    expect(getSqlErrorLines({})).toEqual([])
  })

  it('returns empty array when message is an empty string', () => {
    expect(getSqlErrorLines({ message: '' })).toEqual([])
  })

  it('returns empty array when message only contains whitespace newlines', () => {
    // Only empty segments after filtering — treated as single-line
    expect(getSqlErrorLines({ message: '\n\n' })).toEqual([])
  })

  it('prefers formattedError even when message is also multi-line', () => {
    const lines = getSqlErrorLines({
      message: 'message line 1\nmessage line 2',
      formattedError: 'formatted line 1\nformatted line 2',
    })

    expect(lines).toEqual(['formatted line 1', 'formatted line 2'])
  })

  it('falls through to message when formattedError is empty string', () => {
    const lines = getSqlErrorLines({
      message: 'ERROR: line 1\nHINT: line 2',
      formattedError: '',
    })

    expect(lines).toEqual(['ERROR: line 1', 'HINT: line 2'])
  })
})

describe('trimTrailingSemicolons', () => {
  test('removes a single trailing semicolon', () => {
    const sql = safeSql`select * from countries;`
    expect(trimTrailingSemicolons(sql)).toBe('select * from countries')
  })
  test('removes multiple trailing semicolons', () => {
    const sql = safeSql`select * from countries;;;;;;;`
    expect(trimTrailingSemicolons(sql)).toBe('select * from countries')
  })
  test('leaves a fragment with no trailing semicolon unchanged', () => {
    const sql = safeSql`select * from countries`
    expect(trimTrailingSemicolons(sql)).toBe('select * from countries')
  })
  test('does not touch semicolons that are not trailing', () => {
    const sql = safeSql`select 1; select 2`
    expect(trimTrailingSemicolons(sql)).toBe('select 1; select 2')
  })
})

describe('applyAutoLimit', () => {
  test('Should add the limit to a read-only SELECT query using a CTE', () => {
    const sql = safeSql`WITH numbers AS (SELECT generate_series(1, 2000) AS n) SELECT n FROM numbers;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe(
      'WITH numbers AS (SELECT generate_series(1, 2000) AS n) SELECT n FROM numbers limit 100;'
    )
  })

  test('Should not append a limit to a data-modifying CTE', () => {
    const sql = safeSql`WITH deleted AS (DELETE FROM countries RETURNING *) SELECT * FROM deleted;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a CTE using INSERT', () => {
    const sql = safeSql`WITH inserted AS (INSERT INTO countries (name) VALUES ('Atlantis') RETURNING *) SELECT * FROM inserted;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a CTE using UPDATE', () => {
    const sql = safeSql`WITH updated AS (UPDATE countries SET name = 'Atlantis' RETURNING *) SELECT * FROM updated;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit when the main query of a CTE is data-modifying', () => {
    const sql = safeSql`WITH safe_cte AS (SELECT 1 AS id) DELETE FROM countries WHERE id IN (SELECT id FROM safe_cte);`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should add the limit to multiple read-only CTEs', () => {
    const sql = safeSql`WITH
  users_cte AS (SELECT id, name FROM users),
  posts_cte AS (SELECT user_id, title FROM posts)
SELECT users_cte.name, posts_cte.title FROM users_cte JOIN posts_cte ON users_cte.id = posts_cte.user_id;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe(
      `WITH
  users_cte AS (SELECT id, name FROM users),
  posts_cte AS (SELECT user_id, title FROM posts)
SELECT users_cte.name, posts_cte.title FROM users_cte JOIN posts_cte ON users_cte.id = posts_cte.user_id limit 100;`
    )
  })

  test('Should not append a limit if any CTE in a multi-CTE query is data-modifying', () => {
    const sql = safeSql`WITH
  users_cte AS (SELECT id, name FROM users),
  deleted_posts AS (DELETE FROM posts WHERE user_id = 1 RETURNING user_id, title)
SELECT users_cte.name, deleted_posts.title FROM users_cte JOIN deleted_posts ON users_cte.id = deleted_posts.user_id;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should add the limit to a WITH RECURSIVE query', () => {
    const sql = safeSql`WITH RECURSIVE countdown(val) AS (
  SELECT 10
  UNION ALL
  SELECT val - 1 FROM countdown WHERE val > 1
)
SELECT val FROM countdown;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe(
      `WITH RECURSIVE countdown(val) AS (
  SELECT 10
  UNION ALL
  SELECT val - 1 FROM countdown WHERE val > 1
)
SELECT val FROM countdown limit 100;`
    )
  })

  test('Should add the limit to CTE with column list and MATERIALIZED modifier', () => {
    const sql = safeSql`WITH numbers(val) AS NOT MATERIALIZED (SELECT generate_series(1, 100)) SELECT val FROM numbers;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe(
      'WITH numbers(val) AS NOT MATERIALIZED (SELECT generate_series(1, 100)) SELECT val FROM numbers limit 100;'
    )
  })

  test('Should not append a limit if outer CTE query already has a LIMIT', () => {
    const sql = safeSql`WITH numbers AS (SELECT generate_series(1, 2000) AS n) SELECT n FROM numbers LIMIT 50;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit if outer CTE query already has a FETCH FIRST clause', () => {
    const sql = safeSql`WITH numbers AS (SELECT generate_series(1, 2000) AS n) SELECT n FROM numbers FETCH FIRST 50 ROWS ONLY;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should add limit to outer query even if inner CTE query already has a LIMIT', () => {
    const sql = safeSql`WITH numbers AS (SELECT generate_series(1, 2000) AS n LIMIT 500) SELECT n FROM numbers;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe(
      'WITH numbers AS (SELECT generate_series(1, 2000) AS n LIMIT 500) SELECT n FROM numbers limit 100;'
    )
  })

  test('Should not mistake keywords inside string literals or quoted identifiers as statements', () => {
    const sql = safeSql`WITH "delete" AS (SELECT 'DELETE FROM countries' AS note) SELECT note, "delete" FROM "delete";`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe(
      'WITH "delete" AS (SELECT \'DELETE FROM countries\' AS note) SELECT note, "delete" FROM "delete" limit 100;'
    )
  })

  test('Should not append a limit to nested CTEs that contain data-modifying statements', () => {
    const sql = safeSql`WITH outer_cte AS (
  WITH inner_cte AS (DELETE FROM countries RETURNING *)
  SELECT * FROM inner_cte
)
SELECT * FROM outer_cte;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should handle semicolons inside string literals without treating them as multiple queries', () => {
    const sql = safeSql`WITH cte AS (SELECT 'a;b;c' AS val) SELECT * FROM cte;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(true)
    expect(formattedSql).toBe("WITH cte AS (SELECT 'a;b;c' AS val) SELECT * FROM cte limit 100;")
  })

  test('Should not append a limit to a SELECT ... INTO statement', () => {
    const sql = safeSql`SELECT * INTO new_table FROM countries;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a CTE query using SELECT ... INTO', () => {
    const sql = safeSql`WITH t AS (SELECT 1) SELECT * INTO new_t FROM t;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a query using FOR UPDATE', () => {
    const sql = safeSql`SELECT * FROM countries FOR UPDATE;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a query using FOR KEY SHARE', () => {
    const sql = safeSql`SELECT * FROM countries FOR KEY SHARE;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a CTE query using FOR UPDATE', () => {
    const sql = safeSql`WITH t AS (SELECT 1) SELECT * FROM t FOR UPDATE;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a CTE query using FOR KEY SHARE', () => {
    const sql = safeSql`WITH t AS (SELECT 1) SELECT * FROM t FOR KEY SHARE;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a query where CTE contains FOR SHARE', () => {
    const sql = safeSql`WITH t AS (SELECT * FROM countries FOR SHARE) SELECT * FROM t;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should not append a limit to a query where CTE contains FOR KEY SHARE', () => {
    const sql = safeSql`WITH t AS (SELECT * FROM countries FOR KEY SHARE) SELECT * FROM t;`

    const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, 100)

    expect(appendAutoLimit).toBe(false)
    expect(formattedSql).toBe(sql)
  })

  test('Should return false if limit passed is <= 0', () => {
    const sql = safeSql`select * from countries;`
    const limit = -1
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return true if limit passed is > 0', () => {
    const sql = safeSql`select * from countries;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(true)
  })
  test('Should return false if query already has a limit', () => {
    const sql = safeSql`select * from countries limit 10;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit (check for case-insensitiveness)', () => {
    const sql = safeSql`SELECT * FROM countries LIMIT 10;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit with whitespace before the semi colon', () => {
    const sql = safeSql`select * from countries limit 10 ;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset', () => {
    const sql = safeSql`select * from countries limit 10 offset 0;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset with whitespace before the semi colon', () => {
    const sql = safeSql`select * from countries limit 10 offset 0 ;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset (flip order of limit and offset)', () => {
    const sql = safeSql`select * from countries offset 0 limit 1;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit, even if no value provided for limit', () => {
    const sql = safeSql`select * from countries limit`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `FETCH FIRST` instead of limit ', () => {
    const sql = safeSql`select * from countries FETCH FIRST 5 rows only`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch first` instead of limit ', () => {
    const sql = safeSql`select * from countries fetch first 5 rows only`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch   first` (with random spaces) instead of limit ', () => {
    const sql = safeSql`select * from countries FETCH FIRST 5 rows only`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `FETCH NEXT` instead of limit ', () => {
    const sql = safeSql`select * from countries offset 5 rows FETCH NEXT 5 rows only`
    const { sql: result, appendAutoLimit } = applyAutoLimit(sql, 100)
    expect(appendAutoLimit).toBe(false)
    expect(result).toBe(sql)
  })
  test('Should return false if query is not a select statement', () => {
    const sql = safeSql`create table test (id int8 primary key, name varchar);`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries I', () => {
    const sql1 = safeSql`select * from countries;
select * from cities;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries II', () => {
    const sql1 = safeSql`select * from countries;
select * from cities`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  // [Joshen] Opting to just avoid appending in this case to prevent making the logic overly complex atm
  test('Should return false if query has with a comment I', () => {
    const sql = safeSql`-- This is a comment
select * from cities`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query has with a comment II', () => {
    const sql = safeSql`select * from cities
-- This is a comment`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })

  // [Joshen] These will just need to test the cases when appendAutoLimit returns true then
  test('Should add the limit param properly if query ends without a semi colon', () => {
    const sql = safeSql`select * from countries`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with a semi colon', () => {
    const sql = safeSql`select * from countries;`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with multiple semi colon', () => {
    const sql = safeSql`select * from countries;;;;;;;`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should not append a limit if query already has one with whitespace before the semi colon', () => {
    const sql = safeSql`select * from countries limit 10 ;`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 10 ;')
  })
  test('returns the SafeSqlFragment result unchanged when no limit is appended', () => {
    const sql = safeSql`select * from countries limit 10;`
    const { sql: formattedSql } = applyAutoLimit(sql, 100)
    expect(formattedSql).toBe(sql)
  })
})
