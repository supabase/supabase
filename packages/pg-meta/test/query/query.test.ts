import { describe, expect, test } from 'vitest'

import { Query } from '../../src/query/Query'
import * as QueryUtils from '../../src/query/Query.utils'
import { QueryAction } from '../../src/query/QueryAction'
import { QueryFilter } from '../../src/query/QueryFilter'
import { QueryModifier } from '../../src/query/QueryModifier'
import type { Filter, QueryTable, Sort } from '../../src/query/types'

describe('Query', () => {
  test('from() should create a QueryAction with the correct table', () => {
    const query = new Query()
    const action = query.from('users', 'public')

    expect(action).toBeInstanceOf(QueryAction)
    expect(action['table']).toEqual({ name: 'users', schema: 'public' })
  })

  test('from() should use "public" as the default schema when not provided', () => {
    const query = new Query()
    const action = query.from('users')

    expect(action['table']).toEqual({ name: 'users', schema: 'public' })
  })
})

describe('QueryAction', () => {
  const table: QueryTable = { name: 'users', schema: 'public' }

  test('count() should create a QueryFilter with the correct action', () => {
    const action = new QueryAction(table)
    const filter = action.count()

    expect(filter).toBeInstanceOf(QueryFilter)
    expect(filter['table']).toEqual(table)
    expect(filter['action']).toBe('count')
  })

  test('delete() should create a QueryFilter with the correct action and options', () => {
    const action = new QueryAction(table)
    const filter = action.delete({ returning: true })

    expect(filter).toBeInstanceOf(QueryFilter)
    expect(filter['table']).toEqual(table)
    expect(filter['action']).toBe('delete')
    expect(filter['actionOptions']).toEqual({ returning: true })
  })

  test('insert() should create a QueryFilter with the correct action, values and options', () => {
    const action = new QueryAction(table)
    const values = [{ id: 1, name: 'John' }]
    const filter = action.insert(values, { returning: true })

    expect(filter).toBeInstanceOf(QueryFilter)
    expect(filter['table']).toEqual(table)
    expect(filter['action']).toBe('insert')
    expect(filter['actionValue']).toEqual(values)
    expect(filter['actionOptions']).toEqual({ returning: true })
  })

  test('select() should create a QueryFilter with the correct action and columns', () => {
    const action = new QueryAction(table)
    const filter = action.select('id, name')

    expect(filter).toBeInstanceOf(QueryFilter)
    expect(filter['table']).toEqual(table)
    expect(filter['action']).toBe('select')
    expect(filter['actionValue']).toBe('id, name')
  })

  test('update() should create a QueryFilter with the correct action, value and options', () => {
    const action = new QueryAction(table)
    const value = { name: 'John' }
    const filter = action.update(value, { returning: true })

    expect(filter).toBeInstanceOf(QueryFilter)
    expect(filter['table']).toEqual(table)
    expect(filter['action']).toBe('update')
    expect(filter['actionValue']).toEqual(value)
    expect(filter['actionOptions']).toEqual({ returning: true })
  })

  test('truncate() should create a QueryFilter with the correct action and options', () => {
    const action = new QueryAction(table)
    const filter = action.truncate({ returning: true })

    expect(filter).toBeInstanceOf(QueryFilter)
    expect(filter['table']).toEqual(table)
    expect(filter['action']).toBe('truncate')
    expect(filter['actionOptions']).toEqual({ returning: true })
  })
})

describe('QueryFilter', () => {
  const table: QueryTable = { name: 'users', schema: 'public' }

  test('filter() should add a filter and return the filter instance', () => {
    const queryFilter = new QueryFilter(table, 'select', 'id, name')
    const result = queryFilter.filter('id', '=', 1)

    expect(result).toBe(queryFilter)
    expect(queryFilter['filters']).toEqual([{ column: 'id', operator: '=', value: 1 }])
  })

  test('match() should add multiple filters and return the filter instance', () => {
    const queryFilter = new QueryFilter(table, 'select', 'id, name')
    const result = queryFilter.match({ id: 1, name: 'John' })

    expect(result).toBe(queryFilter)
    expect(queryFilter['filters']).toEqual([
      { column: 'id', operator: '=', value: 1 },
      { column: 'name', operator: '=', value: 'John' },
    ])
  })

  test('order() should add a sort and return the filter instance', () => {
    const queryFilter = new QueryFilter(table, 'select', 'id, name')
    const result = queryFilter.order('users', 'name', false, true)

    expect(result).toBe(queryFilter)
    expect(queryFilter['sorts']).toEqual([
      { table: 'users', column: 'name', ascending: false, nullsFirst: true },
    ])
  })

  test('range() should delegate to QueryModifier.range() and return the result', () => {
    const queryFilter = new QueryFilter(table, 'select', 'id, name')
    const result = queryFilter.range(0, 10)

    expect(result).toBeInstanceOf(QueryModifier)
    // The pagination gets set in the QueryModifier
    expect(result['pagination']).toEqual({ offset: 0, limit: 11 })
  })

  test('toSql() should delegate to QueryModifier.toSql() and return the SQL string', () => {
    const queryFilter = new QueryFilter(table, 'select', 'id, name')
    queryFilter.filter('id', '=', 1)

    const result = queryFilter.toSql()

    // Expected SQL should match the pattern from QueryUtils.selectQuery()
    expect(result).toBe('select id, name from public.users where id = 1;')
  })
})

describe('QueryModifier', () => {
  const table: QueryTable = { name: 'users', schema: 'public' }

  test('range() should set the pagination and return the modifier instance', () => {
    const queryModifier = new QueryModifier(table, 'select', {
      actionValue: 'id, name',
    })
    const result = queryModifier.range(0, 10)

    expect(result).toBe(queryModifier)
    expect(queryModifier['pagination']).toEqual({ offset: 0, limit: 11 })
  })

  test('toSql() should generate the correct SQL for a count query', () => {
    const queryModifier = new QueryModifier(table, 'count')
    const result = queryModifier.toSql()

    expect(result).toBe('select count(*) from public.users;')
  })

  test('toSql() should generate the correct SQL for a delete query with filters', () => {
    const queryModifier = new QueryModifier(table, 'delete', {
      filters: [{ column: 'id', operator: '=', value: 1 }],
      actionOptions: { returning: true },
    })
    const result = queryModifier.toSql()

    expect(result).toBe('delete from public.users where id = 1 returning *;')
  })

  test('toSql() should generate the correct SQL for a select query with filters, sorts and pagination', () => {
    const queryModifier = new QueryModifier(table, 'select', {
      actionValue: 'id, name',
      filters: [{ column: 'id', operator: '>', value: 10 }],
      sorts: [{ table: 'users', column: 'name', ascending: true, nullsFirst: false }],
    })
    queryModifier.range(0, 5)
    const result = queryModifier.toSql()
    expect(result).toMatchInlineSnapshot(
      `"select id, name from public.users where id > 10 order by users.name asc nulls last limit 6 offset 0;"`
    )
  })

  test('toSql() should generate the correct SQL for a truncate query', () => {
    const queryModifier = new QueryModifier(table, 'truncate')
    const result = queryModifier.toSql()

    expect(result).toBe('truncate public.users;')
  })

  test('toSql() should generate the correct SQL for a truncate query with cascade', () => {
    const queryModifier = new QueryModifier(table, 'truncate', {
      actionOptions: { cascade: true },
    })
    const result = queryModifier.toSql()

    expect(result).toBe('truncate public.users cascade;')
  })
})

describe('Query.utils', () => {
  const table: QueryTable = { name: 'users', schema: 'public' }

  describe('countQuery', () => {
    test('should generate a correct count query without filters', () => {
      const result = QueryUtils.countQuery(table)
      expect(result).toBe('select count(*) from public.users;')
    })

    test('should generate a correct count query with filters', () => {
      const filters = [{ column: 'id', operator: '>' as const, value: 1 }]
      const result = QueryUtils.countQuery(table, { filters: filters })
      expect(result).toBe('select count(*) from public.users where id > 1;')
    })
  })

  describe('truncateQuery', () => {
    test('should generate a correct truncate query without cascade', () => {
      const result = QueryUtils.truncateQuery(table)
      expect(result).toBe('truncate public.users;')
    })

    test('should generate a correct truncate query with cascade', () => {
      const result = QueryUtils.truncateQuery(table, { cascade: true })
      expect(result).toBe('truncate public.users cascade;')
    })
  })

  describe('deleteQuery', () => {
    test('should throw an error if no filters are provided', () => {
      expect(() => QueryUtils.deleteQuery(table)).toThrow()
    })

    test('should generate a correct delete query with filters', () => {
      const filters = [{ column: 'id', operator: '=' as const, value: 1 }]
      const result = QueryUtils.deleteQuery(table, filters)
      expect(result).toBe('delete from public.users where id = 1;')
    })

    test('should include returning clause when specified', () => {
      const filters = [{ column: 'id', operator: '=' as const, value: 1 }]
      const result = QueryUtils.deleteQuery(table, filters, { returning: true })
      expect(result).toBe('delete from public.users where id = 1 returning *;')
    })

    test('should include enum array columns in returning clause when specified', () => {
      const filters = [{ column: 'id', operator: '=' as const, value: 1 }]
      const result = QueryUtils.deleteQuery(table, filters, {
        returning: true,
        enumArrayColumns: ['tags'],
      })
      expect(result).toBe('delete from public.users where id = 1 returning *, tags::text[];')
    })
  })

  describe('insertQuery', () => {
    test('should throw an error if no values are provided', () => {
      expect(() => QueryUtils.insertQuery(table, [])).toThrow()
    })

    test('should generate a correct insert query with values', () => {
      const values = [{ id: 1, name: 'John' }]
      const result = QueryUtils.insertQuery(table, values)
      expect(result).toMatchInlineSnapshot(
        `"insert into public.users (id,name) select id,name from jsonb_populate_recordset(null::public.users, '[{"id":1,"name":"John"}]');"`
      )
    })

    test('should include returning clause when specified', () => {
      const values = [{ id: 1, name: 'John' }]
      const result = QueryUtils.insertQuery(table, values, { returning: true })
      expect(result).toMatchInlineSnapshot(
        `"insert into public.users (id,name) select id,name from jsonb_populate_recordset(null::public.users, '[{"id":1,"name":"John"}]') returning *;"`
      )
    })

    test('should include enum array columns in returning clause when specified', () => {
      const values = [{ id: 1, name: 'John' }]
      const result = QueryUtils.insertQuery(table, values, {
        returning: true,
        enumArrayColumns: ['tags'],
      })
      expect(result).toMatchInlineSnapshot(
        `"insert into public.users (id,name) select id,name from jsonb_populate_recordset(null::public.users, '[{"id":1,"name":"John"}]') returning *, tags::text[];"`
      )
    })
  })

  describe('selectQuery', () => {
    test('should generate a correct select query without options', () => {
      const result = QueryUtils.selectQuery(table)
      expect(result).toBe('select * from public.users;')
    })

    test('should generate a correct select query with custom columns', () => {
      const result = QueryUtils.selectQuery(table, 'id, name')
      expect(result).toBe('select id, name from public.users;')
    })

    test('should generate a correct select query with filters', () => {
      const filters = [{ column: 'id', operator: '>' as const, value: 1 }]
      const result = QueryUtils.selectQuery(table, '*', { filters: filters })
      expect(result).toBe('select * from public.users where id > 1;')
    })

    test('should generate a correct select query with sorts', () => {
      const sorts = [{ table: 'users', column: 'name', ascending: true, nullsFirst: false }]
      const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
      expect(result).toBe('select * from public.users order by users.name asc nulls last;')
    })

    test('should generate a correct select query with pagination', () => {
      const pagination = { limit: 10, offset: 0 }
      const result = QueryUtils.selectQuery(table, '*', { pagination: pagination })
      expect(result).toBe('select * from public.users limit 10 offset 0;')
    })

    test('should ignore sorts with undefined column', () => {
      const sorts: Sort[] = [{ table: 'users', column: '', ascending: true, nullsFirst: false }]
      const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
      expect(result).toMatchInlineSnapshot(`"select * from public.users;"`)
    })
  })

  describe('updateQuery', () => {
    test('should throw an error if no filters are provided', () => {
      const value = { name: 'John' }
      expect(() => QueryUtils.updateQuery(table, value)).toThrow()
    })

    test('should generate a correct update query with filters', () => {
      const value = { name: 'John' }
      const filters = [{ column: 'id', operator: '=' as const, value: 1 }]
      const result = QueryUtils.updateQuery(table, value, { filters: filters })
      expect(result).toMatchInlineSnapshot(
        `"update public.users set (name) = (select name from json_populate_record(null::public.users, '{"name":"John"}')) where id = 1;"`
      )
    })

    test('should include returning clause when specified', () => {
      const value = { name: 'John' }
      const filters = [{ column: 'id', operator: '=' as const, value: 1 }]
      const result = QueryUtils.updateQuery(table, value, {
        filters: filters,
        returning: true,
      })
      expect(result).toMatchInlineSnapshot(
        `"update public.users set (name) = (select name from json_populate_record(null::public.users, '{"name":"John"}')) where id = 1 returning *;"`
      )
    })

    test('should include enum array columns in returning clause when specified', () => {
      const value = { name: 'John' }
      const filters = [{ column: 'id', operator: '=' as const, value: 1 }]
      const result = QueryUtils.updateQuery(table, value, {
        filters: filters,
        returning: true,
        enumArrayColumns: ['tags'],
      })
      expect(result).toMatchInlineSnapshot(
        `"update public.users set (name) = (select name from json_populate_record(null::public.users, '{"name":"John"}')) where id = 1 returning *, tags::text[];"`
      )
    })
  })

  describe('Query.utils internal functions', () => {
    describe('applyFilters', () => {
      test('should correctly apply equality filters', () => {
        const filters: Filter[] = [{ column: 'name', operator: '=', value: 'John' }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe("select * from public.users where name = 'John';")
      })

      test('should correctly apply multiple filters with AND logic', () => {
        const filters: Filter[] = [
          { column: 'name', operator: '=', value: 'John' },
          { column: 'age', operator: '>', value: 25 },
        ]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe("select * from public.users where name = 'John' and age > 25;")
      })

      test('should correctly handle "in" operator with array values', () => {
        const filters: Filter[] = [{ column: 'id', operator: 'in', value: [1, 2, 3] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where id in (1,2,3);')
      })

      test('should correctly handle "in" operator with comma-separated string', () => {
        const filters: Filter[] = [{ column: 'id', operator: 'in', value: '1,2,3' }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe("select * from public.users where id in ('1','2','3');")
      })

      test('should correctly handle "is" operator with null value', () => {
        const filters: Filter[] = [{ column: 'email', operator: 'is', value: 'null' }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where email is null;')
      })

      test('should correctly handle "is" operator with not null value', () => {
        const filters: Filter[] = [{ column: 'email', operator: 'is', value: 'not null' }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where email is not null;')
      })

      test('should correctly handle "is" operator with boolean values', () => {
        const filters: Filter[] = [{ column: 'active', operator: 'is', value: 'true' }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where active is true;')
      })

      test('should correctly escape string values in filters', () => {
        const filters: Filter[] = [{ column: 'name', operator: '=', value: "O'Reilly" }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toContain("where name = 'O''Reilly'")
      })

      test('should error if tuple filter value length does not match column length', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '=', value: [1] }]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError(
          'Tuple filter value must have the same length as the column array'
        )
      })

      test('should error if tuple filter value is not an array', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '=', value: 1 }]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError(
          'Tuple filter value must be an array'
        )
      })

      test('should correctly handle tuple filters with equality operator', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '=', value: [1, 2] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where (id, version) = (1, 2);')
      })

      test('should correctly handle tuple filters with greater than operator', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '>', value: [1, 2] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where (id, version) > (1, 2);')
      })

      test('should correctly handle tuple filters with greater than or equal operator', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '>=', value: [1, 2] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where (id, version) >= (1, 2);')
      })

      test('should correctly handle tuple filters with less than operator', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '<', value: [10, 5] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where (id, version) < (10, 5);')
      })

      test('should correctly handle tuple filters with less than or equal operator', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '<=', value: [10, 5] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where (id, version) <= (10, 5);')
      })

      test('should correctly handle tuple filters with not equal operator (<>)', () => {
        const filters: Filter[] = [{ column: ['id', 'version'], operator: '<>', value: [1, 2] }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where (id, version) <> (1, 2);')
      })

      test('should correctly handle tuple filters with in operator', () => {
        const filters: Filter[] = [
          {
            column: ['id', 'version'],
            operator: 'in',
            value: [
              [1, 2],
              [3, 4],
              [5, 6],
            ],
          },
        ]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe(
          'select * from public.users where (id, version) in ((1, 2), (3, 4), (5, 6));'
        )
      })

      test('should error if tuple filters with in operator do not have matching number of array values', () => {
        const filters: Filter[] = [
          {
            column: ['id', 'version'],
            operator: 'in',
            value: [[1, 2], [3, 4], [5]],
          },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })

      test('should correctly handle tuple filters with in operator using strings', () => {
        const filters: Filter[] = [
          {
            column: ['id', 'version'],
            operator: 'in',
            value: ['one,two', 'three,four', 'five,six'],
          },
        ]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe(
          `select * from public.users where (id, version) in (('one', 'two'), ('three', 'four'), ('five', 'six'));`
        )
      })

      test('should error if tuple filters with in operator do not have matching number of stringified values', () => {
        const filters: Filter[] = [
          {
            column: ['id', 'version'],
            operator: 'in',
            value: ['one,two', 'three,four', 'five'],
          },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })

      test('should correctly handle tuple filters with string values', () => {
        const filters: Filter[] = [
          { column: ['first_name', 'last_name'], operator: '=', value: ['John', 'Doe'] },
        ]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe(
          "select * from public.users where (first_name, last_name) = ('John', 'Doe');"
        )
      })

      test('should correctly handle mixed tuple and regular filters', () => {
        const filters: Filter[] = [
          { column: ['id', 'version'], operator: '>', value: [1, 2] },
          { column: 'active', operator: '=', value: true },
        ]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe(
          'select * from public.users where (id, version) > (1, 2) and active = true;'
        )
      })

      test('should error when trying to use "is" operator as a tuple filter', () => {
        const filters: Filter[] = [
          {
            column: ['id', 'version'],
            operator: 'is',
            value: [null, null],
          },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })

      test('should error when trying to use "~~" operator as a tuple filter', () => {
        const filters: Filter[] = [
          {
            column: ['first_name', 'last_name'],
            operator: '~~',
            value: ['%John%', '%Doe%'],
          },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })

      test('should error when trying to use "~~*" operator as a tuple filter', () => {
        const filters: Filter[] = [
          { column: ['first_name', 'last_name'], operator: '~~*', value: ['%john%', '%doe%'] },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })

      test('should error when trying to use "!~~" operator as a tuple filter', () => {
        const filters: Filter[] = [
          { column: ['first_name', 'last_name'], operator: '!~~', value: ['%Admin%', '%System%'] },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })

      test('should error when trying to use "!~~*" operator as a tuple filter', () => {
        const filters: Filter[] = [
          { column: ['first_name', 'last_name'], operator: '!~~*', value: ['%admin%', '%system%'] },
        ]
        expect(() => QueryUtils.selectQuery(table, '*', { filters: filters })).toThrowError()
      })
    })

    describe('applySorts', () => {
      test('should correctly apply a single sort with default options', () => {
        const sorts: Sort[] = [
          { table: 'users', column: 'name', ascending: true, nullsFirst: false },
        ]
        const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
        expect(result).toBe('select * from public.users order by users.name asc nulls last;')
      })

      test('should correctly apply a descending sort', () => {
        const sorts: Sort[] = [
          { table: 'users', column: 'name', ascending: false, nullsFirst: false },
        ]
        const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
        expect(result).toBe('select * from public.users order by users.name desc nulls last;')
      })

      test('should correctly apply nulls first option', () => {
        const sorts: Sort[] = [
          { table: 'users', column: 'name', ascending: true, nullsFirst: true },
        ]
        const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
        expect(result).toBe('select * from public.users order by users.name asc nulls first;')
      })

      test('should correctly apply multiple sorts', () => {
        const sorts: Sort[] = [
          { table: 'users', column: 'last_name', ascending: true, nullsFirst: false },
          { table: 'users', column: 'first_name', ascending: true, nullsFirst: false },
        ]
        const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
        expect(result).toBe(
          'select * from public.users order by users.last_name asc nulls last, users.first_name asc nulls last;'
        )
      })

      test('should ignore sorts with undefined column', () => {
        const sorts: Sort[] = [{ table: 'users', column: '', ascending: true, nullsFirst: false }]
        const result = QueryUtils.selectQuery(table, '*', { sorts: sorts })
        expect(result).toMatchInlineSnapshot(`"select * from public.users;"`)
      })
    })

    describe('filterLiteral', () => {
      test('should correctly handle array literal syntax', () => {
        const filters: Filter[] = [{ column: 'tags', operator: '=', value: "ARRAY['tag1','tag2']" }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe("select * from public.users where tags = ARRAY['tag1','tag2'];")
      })

      test('should correctly handle non-string values', () => {
        const filters: Filter[] = [{ column: 'active', operator: '=', value: true }]
        const result = QueryUtils.selectQuery(table, '*', { filters: filters })
        expect(result).toBe('select * from public.users where active = true;')
      })
    })

    describe('queryTable', () => {
      test('should correctly format the table name with schema', () => {
        const result = QueryUtils.selectQuery({ name: 'orders', schema: 'shop' })
        expect(result).toBe('select * from shop.orders;')
      })
    })
  })
})

describe('End-to-end query chaining', () => {
  test('should correctly build a simple select query', () => {
    const query = new Query()
    const sql = query.from('users', 'public').select('id, name, email').toSql()

    expect(sql).toBe('select id, name, email from public.users;')
  })

  test('should correctly build a filtered select query', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .select('id, name, email')
      .filter('id', '>', 10)
      .toSql()

    expect(sql).toBe('select id, name, email from public.users where id > 10;')
  })

  test('should correctly build a select query with multiple filters', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .select('id, name, email')
      .filter('id', '>', 10)
      .filter('name', '~~', '%John%')
      .toSql()

    expect(sql).toBe(
      "select id, name, email from public.users where id > 10 and name::text ~~ '%John%';"
    )
  })

  test('should correctly build a select query with match criteria', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .select('id, name, email')
      .match({ active: true, role: 'admin' })
      .toSql()

    expect(sql).toBe(
      "select id, name, email from public.users where active = true and role = 'admin';"
    )
  })

  test('should correctly build a select query with sorting', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .select('id, name, email')
      .order('users', 'name', true, false)
      .toSql()

    expect(sql).toBe('select id, name, email from public.users order by users.name asc nulls last;')
  })

  test('should correctly build a select query with pagination', () => {
    const query = new Query()
    const sql = query.from('users', 'public').select('id, name, email').range(0, 9).toSql()

    expect(sql).toBe('select id, name, email from public.users limit 10 offset 0;')
  })

  test('should correctly build a complete select query with filters, sorting and pagination', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .select('id, name, email')
      .filter('id', '>', 10)
      .match({ active: true })
      .order('users', 'name', true, false)
      .range(0, 9)
      .toSql()

    expect(sql).toBe(
      'select id, name, email from public.users where id > 10 and active = true order by users.name asc nulls last limit 10 offset 0;'
    )
  })

  test('should correctly build an insert query', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .insert([{ name: 'John', email: 'john@example.com' }], { returning: true })
      .toSql()
    expect(sql).toMatchInlineSnapshot(
      `"insert into public.users (name,email) select name,email from jsonb_populate_recordset(null::public.users, '[{"name":"John","email":"john@example.com"}]') returning *;"`
    )
  })

  test('should correctly build an update query', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .update({ name: 'Updated Name' }, { returning: true })
      .filter('id', '=', 1)
      .toSql()
    expect(sql).toMatchInlineSnapshot(
      `"update public.users set (name) = (select name from json_populate_record(null::public.users, '{"name":"Updated Name"}')) where id = 1 returning *;"`
    )
  })

  test('should correctly build a delete query', () => {
    const query = new Query()
    const sql = query
      .from('users', 'public')
      .delete({ returning: true })
      .filter('id', '=', 1)
      .toSql()

    expect(sql).toBe('delete from public.users where id = 1 returning *;')
  })

  test('should correctly build a count query', () => {
    const query = new Query()
    const sql = query.from('users', 'public').count().filter('active', '=', true).toSql()

    expect(sql).toBe('select count(*) from public.users where active = true;')
  })

  test('should correctly build a truncate query', () => {
    const query = new Query()
    const sql = query.from('users', 'public').truncate().toSql()

    expect(sql).toBe('truncate public.users;')
  })
})
