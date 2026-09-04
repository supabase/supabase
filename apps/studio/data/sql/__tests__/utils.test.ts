import { safeSql } from '@supabase/pg-meta'
import { describe, expect, it, test } from 'vitest'

import {
  applyAutoLimit,
  getSqlErrorLines,
  isNonReturningDml,
  trimTrailingSemicolons,
} from '../utils'

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

describe('isNonReturningDml', () => {
  describe('returns true for DML statements without RETURNING', () => {
    it('detects a plain UPDATE', () => {
      expect(isNonReturningDml('update users set name = $1 where id = $2')).toBe(true)
    })

    it('detects a plain DELETE', () => {
      expect(isNonReturningDml('delete from users where id = 1')).toBe(true)
    })

    it('detects a plain INSERT', () => {
      expect(isNonReturningDml("insert into users (name) values ('Alice')")).toBe(true)
    })

    it('detects MERGE', () => {
      expect(isNonReturningDml('merge into target using source on target.id = source.id')).toBe(
        true
      )
    })

    it('detects CALL', () => {
      expect(isNonReturningDml('call my_procedure(1, 2, 3)')).toBe(true)
    })

    it('detects DO (anonymous block)', () => {
      expect(isNonReturningDml("do $$ begin raise notice 'hi'; end $$")).toBe(true)
    })

    it('handles leading whitespace and mixed case', () => {
      expect(isNonReturningDml('  UPDATE users SET active = false ')).toBe(true)
    })

    it('handles multi-line SQL', () => {
      expect(
        isNonReturningDml(`
          update
            position_log
          set notes = notes
          where id = (select id from position_log limit 1)
        `)
      ).toBe(true)
    })

    it('strips line comments before checking keyword', () => {
      expect(
        isNonReturningDml(`-- delete old rows
update users set deleted = true where id = 1`)
      ).toBe(true)
    })
  })

  describe('returns false when a RETURNING clause is present', () => {
    it('UPDATE … RETURNING', () => {
      expect(isNonReturningDml('update users set name = $1 where id = $2 returning id, name')).toBe(
        false
      )
    })

    it('DELETE … RETURNING', () => {
      expect(isNonReturningDml('delete from users where id = 1 returning *')).toBe(false)
    })

    it('INSERT … RETURNING', () => {
      expect(isNonReturningDml("insert into users (name) values ('Alice') returning id")).toBe(
        false
      )
    })
  })

  describe('handles CTEs (WITH clauses)', () => {
    it('classifies WITH ... UPDATE without RETURNING as non-returning DML', () => {
      expect(
        isNonReturningDml(`
          WITH regional_sales AS (
            SELECT region, SUM(amount) AS total_sales
            FROM orders
            GROUP BY region
          )
          UPDATE orders
          SET discount = 0.1
          WHERE region IN (SELECT region FROM regional_sales WHERE total_sales > 1000)
        `)
      ).toBe(true)
    })

    it('classifies WITH ... UPDATE with RETURNING as returning', () => {
      expect(
        isNonReturningDml(`
          WITH cte AS (SELECT id FROM users)
          UPDATE profile SET active = true WHERE user_id IN (SELECT id FROM cte)
          RETURNING user_id
        `)
      ).toBe(false)
    })

    it('classifies WITH ... DELETE without RETURNING as non-returning DML', () => {
      expect(
        isNonReturningDml(`
          WITH old_records AS (
            SELECT id FROM logs WHERE created_at < NOW() - INTERVAL '30 days'
          )
          DELETE FROM logs WHERE id IN (SELECT id FROM old_records)
        `)
      ).toBe(true)
    })

    it('classifies WITH ... DELETE with RETURNING as returning', () => {
      expect(
        isNonReturningDml(`
          WITH old_records AS (
            SELECT id FROM logs WHERE created_at < NOW() - INTERVAL '30 days'
          )
          DELETE FROM logs WHERE id IN (SELECT id FROM old_records)
          RETURNING id
        `)
      ).toBe(false)
    })

    it('classifies WITH ... INSERT without RETURNING as non-returning DML', () => {
      expect(
        isNonReturningDml(`
          WITH new_data AS (
            SELECT 1 AS a, 2 AS b
          )
          INSERT INTO target (a, b) SELECT a, b FROM new_data
        `)
      ).toBe(true)
    })

    it('classifies WITH ... INSERT with RETURNING as returning', () => {
      expect(
        isNonReturningDml(`
          WITH new_data AS (
            SELECT 1 AS a, 2 AS b
          )
          INSERT INTO target (a, b) SELECT a, b FROM new_data
          RETURNING *
        `)
      ).toBe(false)
    })

    it('classifies WITH ... SELECT as returning (not non-returning DML)', () => {
      expect(
        isNonReturningDml(`
          WITH data AS (
            SELECT id, name FROM users
          )
          SELECT * FROM data
        `)
      ).toBe(false)
    })

    it('handles WITH RECURSIVE', () => {
      expect(
        isNonReturningDml(`
          WITH RECURSIVE subordinates AS (
            SELECT employee_id, manager_id FROM employees WHERE employee_id = 1
            UNION ALL
            SELECT e.employee_id, e.manager_id FROM employees e
            JOIN subordinates s ON e.manager_id = s.employee_id
          )
          UPDATE employees SET reviewed = true WHERE employee_id IN (SELECT employee_id FROM subordinates)
        `)
      ).toBe(true)
    })

    it('classifies data-modifying CTE followed by non-returning main DML correctly', () => {
      expect(
        isNonReturningDml(`
          WITH archived AS (
            DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days'
            RETURNING *
          )
          INSERT INTO logs_archive SELECT * FROM archived
        `)
      ).toBe(true)
    })

    it('classifies data-modifying CTE followed by SELECT as returning', () => {
      expect(
        isNonReturningDml(`
          WITH deleted AS (
            DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days'
            RETURNING *
          )
          SELECT count(*) FROM deleted
        `)
      ).toBe(false)
    })

    it('handles CTEs with column aliases', () => {
      expect(
        isNonReturningDml(`
          WITH cte(col1, col2) AS (
            SELECT 1, 2
          )
          UPDATE target SET a = 1
        `)
      ).toBe(true)
    })
  })

  describe('handles string literals, quoted identifiers, and comments safely', () => {
    it('preserves RETURNING clause when -- is inside a string literal', () => {
      expect(isNonReturningDml("UPDATE t SET note = '--' RETURNING id")).toBe(false)
    })

    it('preserves RETURNING clause when /* */ is inside a string literal', () => {
      expect(isNonReturningDml("UPDATE t SET note = '/* comment */' RETURNING id")).toBe(false)
    })

    it('does not treat returning inside a string literal as a RETURNING clause', () => {
      expect(isNonReturningDml("UPDATE t SET note = 'returning this tomorrow'")).toBe(true)
    })

    it('does not treat returning inside a quoted identifier as a RETURNING clause', () => {
      expect(isNonReturningDml('UPDATE "returning" SET id = 1')).toBe(true)
    })

    it('does not treat returning inside a dollar-quoted body as a RETURNING clause', () => {
      expect(isNonReturningDml('UPDATE t SET note = $$ returning $$ WHERE id = 1')).toBe(true)
    })

    it('does not treat returning inside a tagged dollar-quoted body as a RETURNING clause', () => {
      expect(isNonReturningDml('UPDATE t SET note = $tag$ returning $tag$ WHERE id = 1')).toBe(true)
    })

    it('handles nested block comments', () => {
      expect(isNonReturningDml('/* outer /* inner */ */ UPDATE users SET id = 1')).toBe(true)
    })

    it('respects word boundaries so function names starting with DML keywords do not match', () => {
      expect(isNonReturningDml('update_stats()')).toBe(false)
      expect(isNonReturningDml('insert_audit_log()')).toBe(false)
      expect(isNonReturningDml('delete_old_records()')).toBe(false)
    })
  })

  describe('returns false for non-DML statements', () => {
    it('plain SELECT', () => {
      expect(isNonReturningDml('select * from users')).toBe(false)
    })

    it('CREATE TABLE', () => {
      expect(isNonReturningDml('create table foo (id int)')).toBe(false)
    })

    it('ALTER TABLE', () => {
      expect(isNonReturningDml('alter table foo add column bar text')).toBe(false)
    })

    it('DROP TABLE', () => {
      expect(isNonReturningDml('drop table foo')).toBe(false)
    })

    it('empty string', () => {
      expect(isNonReturningDml('')).toBe(false)
    })

    it('only whitespace', () => {
      expect(isNonReturningDml('   \n\t  ')).toBe(false)
    })
  })
})
