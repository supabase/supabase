import { safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
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

  // A single-line (or empty) message returns no lines so callers render their fallback.
  it.each([
    ['a single-line message', { message: 'permission denied for table users' }],
    ['both fields missing', {}],
    ['an empty message', { message: '' }],
    ['a message of only newlines', { message: '\n\n' }],
  ])('returns an empty array for %s', (_, error) => {
    expect(getSqlErrorLines(error)).toEqual([])
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
  test('does not append when the limit passed is <= 0', () => {
    expect(applyAutoLimit(safeSql`select * from countries;`, -1).appendAutoLimit).toBe(false)
  })

  test.each([
    ['without a semicolon', 'select * from countries'],
    ['with a semicolon', 'select * from countries;'],
    ['with multiple semicolons', 'select * from countries;;;;;;;'],
  ])('appends the limit to a query %s', (_, query) => {
    expect(applyAutoLimit(query as SafeSqlFragment, 100)).toEqual({
      sql: 'select * from countries limit 100;',
      appendAutoLimit: true,
    })
  })

  test('appends the limit to a CTE query', () => {
    const sql = safeSql`WITH numbers AS (SELECT generate_series(1, 2000) AS n) SELECT n FROM numbers;`
    const result = applyAutoLimit(sql, 100)
    expect(result.appendAutoLimit).toBe(true)
    expect(result.sql).toBe(
      'WITH numbers AS (SELECT generate_series(1, 2000) AS n) SELECT n FROM numbers limit 100;'
    )
  })

  test.each([
    [
      'a recursive CTE whose inner query has its own limit',
      'with recursive t as (select 1 as n limit 5) select * from t',
    ],
    [
      'a read-only CTE whose literals or identifiers contain write keywords',
      `with t as (select 'update' as "delete") select * from t`,
    ],
  ])('appends the limit to %s', (_, query) => {
    expect(applyAutoLimit(query as SafeSqlFragment, 100).appendAutoLimit).toBe(true)
  })

  test.each([
    // Existing limits, in any casing/whitespace/order, including LIMIT ALL / NULL
    'select * from countries limit 10;',
    'SELECT * FROM countries LIMIT 10;',
    'select * from countries limit 10 ;',
    'select * from countries limit 10 offset 0;',
    'select * from countries limit 10 offset 0 ;',
    'select * from countries offset 0 limit 1;',
    'select * from countries limit',
    'select * from countries limit all;',
    'select * from countries limit all',
    'SELECT * FROM countries LIMIT ALL ;',
    'select * from countries limit null;',
    'select * from countries limit all offset 5;',
    'select * from countries offset 5 limit null',
    'with t as (select 1) select * from t limit 10',
    // FETCH FIRST / NEXT instead of limit
    'select * from countries FETCH FIRST 5 rows only',
    'select * from countries fetch   first 5 rows only',
    'select * from countries offset 5 rows FETCH NEXT 5 rows only',
    // CTEs that write
    'with d as (delete from t returning *) select * from d',
    'with s as (select 1) insert into t select * from s',
    'with s as (select 1) update t set a = 1',
    'with t as (select 1) select * into new_t from t',
    // Non-select statements and multiple statements
    'create table test (id int8 primary key, name varchar);',
    'select * from countries;\nselect * from cities;',
    'select * from countries;\nselect * from cities',
    // [Joshen] Opting to just avoid appending with comments to keep the logic simple atm
    '-- This is a comment\nselect * from cities',
    'select * from cities\n-- This is a comment',
  ])('leaves the query unchanged: %s', (query) => {
    expect(applyAutoLimit(query as SafeSqlFragment, 100)).toEqual({
      sql: query,
      appendAutoLimit: false,
    })
  })
})
