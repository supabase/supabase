import { stripIndent } from 'common-tags'
import { describe, expect, it, test } from 'vitest'

import {
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'

describe('SQLEditor.utils.ts:checkIfAppendLimitRequired', () => {
  test('Should return false if limit passed is <= 0', () => {
    const sql = 'select * from countries;'
    const limit = -1
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return true if limit passed is > 0', () => {
    const sql = 'select * from countries;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(true)
  })
  test('Should return false if query already has a limit', () => {
    const sql = 'select * from countries limit 10;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit (check for case-insensitiveness)', () => {
    const sql = 'SELECT * FROM countries LIMIT 10;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset', () => {
    const sql = 'select * from countries limit 10 offset 0;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset (flip order of limit and offset)', () => {
    const sql = 'select * from countries offset 0 limit 1;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit, even if no value provided for limit', () => {
    const sql = 'select * from countries limit'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `FETCH FIRST` instead of limit ', () => {
    const sql = 'select * from countries FETCH FIRST 5 rows only'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch first` instead of limit ', () => {
    const sql = 'select * from countries fetch first 5 rows only'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch   first` (with random spaces) instead of limit ', () => {
    const sql = 'select * from countries FETCH FIRST 5 rows only'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query is not a select statement', () => {
    const sql = 'create table test (id int8 primary key, name varchar);'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries I', () => {
    const sql1 = `
select * from countries;
select * from cities;
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries II', () => {
    const sql1 = `
select * from countries;
select * from cities
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  // [Joshen] Opting to just avoid appending in this case to prevent making the logic overly complex atm
  test('Should return false if query has with a comment I', () => {
    const sql = `
-- This is a comment
select * from cities
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query has with a comment II', () => {
    const sql = `
select * from cities
-- This is a comment
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
})

// [Joshen] These will just need to test the cases when appendAutoLimit returns true then
describe('SQLEditor.utils.ts:suffixWithLimit', () => {
  test('Should add the limit param properly if query ends without a semi colon', () => {
    const sql = 'select * from countries'
    const limit = 100
    const formattedSql = suffixWithLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with a semi colon', () => {
    const sql = 'select * from countries;'
    const limit = 100
    const formattedSql = suffixWithLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with multiple semi colon', () => {
    const sql = 'select * from countries;;;;;;;'
    const limit = 100
    const formattedSql = suffixWithLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
})

describe(`SQLEditor.utils.ts:checkDestructiveQuery`, () => {
  it('drop statement matches', () => {
    const match = checkDestructiveQuery('drop table films, distributors;')

    expect(match).toBe(true)
  })

  it('truncate statement matches', () => {
    const match = checkDestructiveQuery('truncate films;')

    expect(match).toBe(true)
  })

  it('delete statement matches', () => {
    const match = checkDestructiveQuery("delete from films where kind <> 'Musical';")

    expect(match).toBe(true)
  })

  it('delete statement after another statement matches', () => {
    const match = checkDestructiveQuery(stripIndent`
      select * from films;

      delete from films where kind <> 'Musical';
    `)

    expect(match).toBe(true)
  })

  it("rls policy containing delete doesn't match", () => {
    const match = checkDestructiveQuery(stripIndent`
      create policy "Users can delete their own files"
      on storage.objects for delete to authenticated using (
        bucket id = 'files' and (select auth.uid()) = owner
      );
    `)

    expect(match).toBe(false)
  })

  it('capitalized statement matches', () => {
    const match = checkDestructiveQuery("DELETE FROM films WHERE kind <> 'Musical';")

    expect(match).toBe(true)
  })

  it("comment containing keyword doesn't match", () => {
    const match = checkDestructiveQuery(stripIndent`
      -- Going to drop this in here, might delete later
      select * from films;
    `)

    expect(match).toBe(false)
  })
})

describe('SQLEditor.utils:updateWithoutWhere', () => {
  it('contains an update query with a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE public.countries SET name = 'New Name' WHERE id = 1;
    `)

    expect(match).toBe(false)
  })

  it('contains an update query without a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE public.countries SET name = 'New Name';
    `)

    expect(match).toBe(true)
  })

  it('contains an update query, with quoted identifiers with a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE "public"."countries" SET name = 'New Name' WHERE id = 1;
    `)

    expect(match).toBe(false)
  })

  it('contains an update query, with quoted identifiers without a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE "public"."countries" SET name = 'New Name';
    `)

    expect(match).toBe(true)
  })

  it('contains both an update query and a delete query, triggers destructive', () => {
    const match = checkDestructiveQuery(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })

  it('contains both an update query and a delete query, triggers no where', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })
  it('contains both an update query and a delete query, triggers no where', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })

  it('should catch potential destructive queries', () => {
    const DESTRUCTIVE_QUERIES = [
      `ALTER TABLE test DROP COLUMN test;`,
      `DELETE FROM test;`,
      `DROP TABLE test;`,
      `TRUNCATE TABLE test;`,
    ]

    DESTRUCTIVE_QUERIES.forEach((query) => {
      expect(checkDestructiveQuery(query), `Query ${query} should be destructive`).toBe(true)
    })
  })
})

describe('SQLEditor.utils:checkAlterDatabaseConnection', () => {
  it('detects connection limit 0', () => {
    const match = checkAlterDatabaseConnection('alter database postgres connection limit 0;')
    expect(match).toBe(true)
  })

  it('detects allow_connections false', () => {
    const match = checkAlterDatabaseConnection('alter database postgres allow_connections false;')
    expect(match).toBe(true)
  })

  it('detects case-insensitive match', () => {
    const match = checkAlterDatabaseConnection('ALTER DATABASE postgres CONNECTION LIMIT 0;')
    expect(match).toBe(true)
  })

  it('detects statement among multiple statements', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      select * from countries;
      alter database postgres connection limit 0;
    `)
    expect(match).toBe(true)
  })

  it('does not flag unrelated alter database statement', () => {
    const match = checkAlterDatabaseConnection(
      'alter database postgres set statement_timeout = 60000;'
    )
    expect(match).toBe(false)
  })

  it('does not flag non-alter statements', () => {
    const match = checkAlterDatabaseConnection('select * from countries;')
    expect(match).toBe(false)
  })

  it('ignores statements inside comments', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      -- alter database postgres connection limit 0;
      select 1;
    `)
    expect(match).toBe(false)
  })

  it('detects both dangerous statements in same query', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      alter database postgres connection limit 0;
      alter database postgres allow_connections false;
    `)
    expect(match).toBe(true)
  })
})
