import { stripIndent } from 'common-tags'
import {
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  isUpdateWithoutWhere,
  suffixWithLimit,
  formatExecutionTime,
  formatResultSize,
  formatQueryStats,
  estimateQueryComplexity,
  getComplexityLabel,
} from './SQLEditor.utils'
import { describe, test, expect, it } from 'vitest'

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

describe('SQLEditor.utils:formatExecutionTime', () => {
  it('should format milliseconds correctly', () => {
    expect(formatExecutionTime(500)).toBe('500.00ms')
  })

  it('should format seconds correctly', () => {
    expect(formatExecutionTime(2500)).toBe('2.50s')
  })

  it('should format minutes correctly', () => {
    expect(formatExecutionTime(90000)).toBe('1m 30s')
  })
})

describe('SQLEditor.utils:formatResultSize', () => {
  it('should format bytes correctly', () => {
    expect(formatResultSize(500)).toBe('500 B')
  })

  it('should format kilobytes correctly', () => {
    expect(formatResultSize(2048)).toBe('2.0 KB')
  })

  it('should format megabytes correctly', () => {
    expect(formatResultSize(1048576)).toBe('1.0 MB')
  })
})

describe('SQLEditor.utils:formatQueryStats', () => {
  it('should format query stats correctly', () => {
    const stats = { executionTime: 500, rowCount: 10, resultSize: 2048 }
    expect(formatQueryStats(stats)).toBe('500.00ms | 10 rows | 2.0 KB')
  })

  it('should handle singular row', () => {
    const stats = { executionTime: 100, rowCount: 1, resultSize: 100 }
    expect(formatQueryStats(stats)).toBe('100.00ms | 1 row | 100 B')
  })
})

describe('SQLEditor.utils:estimateQueryComplexity', () => {
  it('should return low score for simple queries', () => {
    const score = estimateQueryComplexity('SELECT * FROM users')
    expect(score).toBeLessThanOrEqual(2)
  })

  it('should return higher score for queries with joins', () => {
    const score = estimateQueryComplexity('SELECT * FROM users JOIN orders ON users.id = orders.user_id')
    expect(score).toBeGreaterThan(2)
  })

  it('should return high score for complex queries', () => {
    const score = estimateQueryComplexity(`
      WITH cte AS (SELECT * FROM users)
      SELECT * FROM cte
      JOIN orders ON cte.id = orders.user_id
      WHERE orders.total > (SELECT AVG(total) FROM orders)
      GROUP BY cte.id
    `)
    expect(score).toBeGreaterThan(5)
  })
})

describe('SQLEditor.utils:getComplexityLabel', () => {
  it('should return Simple for low scores', () => {
    expect(getComplexityLabel(1)).toBe('Simple')
    expect(getComplexityLabel(2)).toBe('Simple')
  })

  it('should return Moderate for medium scores', () => {
    expect(getComplexityLabel(3)).toBe('Moderate')
    expect(getComplexityLabel(5)).toBe('Moderate')
  })

  it('should return Complex for high scores', () => {
    expect(getComplexityLabel(6)).toBe('Complex')
    expect(getComplexityLabel(7)).toBe('Complex')
  })

  it('should return Very Complex for very high scores', () => {
    expect(getComplexityLabel(8)).toBe('Very Complex')
    expect(getComplexityLabel(10)).toBe('Very Complex')
  })
})
