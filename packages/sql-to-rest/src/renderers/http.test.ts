import { describe, expect, test } from '@jest/globals'
import { stripIndents } from 'common-tags'
import { processSql } from '../processor'
import { renderHttp } from './http'

describe('select', () => {
  test('specified columns', async () => {
    const sql = stripIndents`
      select
        title,
        description
      from
        books
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=title,description')
  })

  test('inline target expression fails', async () => {
    const sql = stripIndents`
      select
        1 + 1
      from
        books
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('missing table fails', async () => {
    const sql = stripIndents`
      select 'Test'
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('aliased column', async () => {
    const sql = stripIndents`
      select
        title as my_title
      from
        books
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=my_title:title')
  })

  test('remove alias when it matches column name', async () => {
    const sql = stripIndents`
      select
        title as title
      from
        books
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=title')
  })

  test('equal', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title = 'Cheese'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?title=eq.Cheese')
  })

  test('not equal', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title != 'Cheese'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?title=neq.Cheese')
  })

  test('not wrapped equal', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        not (
          title = 'Cheese'
        )
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?title=not.eq.Cheese')
  })

  test('null', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title is null
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?title=is.null')
  })

  test('not null', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title is not null
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?title=not.is.null')
  })

  test('float type', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        pages > 10.1
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?pages=gt.10.1')
  })

  test('greater than', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        pages > 10
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?pages=gt.10')
  })

  test('greater than or equal', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        pages >= 10
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?pages=gte.10')
  })

  test('less than', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        pages < 10
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?pages=lt.10')
  })

  test('less than or equal', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        pages <= 10
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?pages=lte.10')
  })

  test('"and" expression', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title = 'Cheese' and
        description ilike '%salsa%'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?title=eq.Cheese&description=ilike.*salsa*')
  })

  test('"or" expression', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title = 'Cheese' or
        title = 'Salsa'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?or=(title.eq.Cheese,title.eq.Salsa)')
  })

  test('negated "and" expression', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        not (
          title = 'Cheese' and
          description ilike '%salsa%'
        )
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?not.and=(title.eq.Cheese,description.ilike.*salsa*)')
  })

  test('negated "or" expression', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        not (
          title = 'Cheese' or
          title = 'Salsa'
        )
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?not.or=(title.eq.Cheese,title.eq.Salsa)')
  })

  test('"and" expression with nested "or"', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title like 'T%' and
        (
          description ilike '%tacos%' or
          description ilike '%salsa%'
        )
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe(
      '/books?title=like.T*&or=(description.ilike.*tacos*,description.ilike.*salsa*)'
    )
  })

  test('negated "and" expression with nested "or"', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        not (
          title like 'T%' and
          (
            description ilike '%tacos%' or
            description ilike '%salsa%'
          )
        )
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe(
      '/books?not.and=(title.like.T*,or(description.ilike.*tacos*,description.ilike.*salsa*))'
    )
  })

  test('negated "and" expression with negated nested "or"', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        not (
          title like 'T%' and
          not (
            description ilike '%tacos%' or
            description ilike '%salsa%'
          )
        )
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe(
      '/books?not.and=(title.like.T*,not.or(description.ilike.*tacos*,description.ilike.*salsa*))'
    )
  })

  test('order of operations', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        title like 'T%' and
        description ilike '%tacos%' or
        description ilike '%salsa%'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe(
      '/books?or=(and(title.like.T*,description.ilike.*tacos*),description.ilike.*salsa*)'
    )
  })

  test('limit', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      limit
        5
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?limit=5')
  })

  test('offset', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      offset
        10
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?offset=10')
  })

  test('limit and offset', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      limit
        5
      offset
        10
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?limit=5&offset=10')
  })

  test('order by', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title')
  })

  test('order by multiple columns', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title,
        description
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title,description')
  })

  test('order by asc', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title asc
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title.asc')
  })

  test('order by desc', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title desc
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title.desc')
  })

  test('order by nulls first', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title nulls first
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title.nullsfirst')
  })

  test('order by nulls last', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title nulls last
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title.nullslast')
  })

  test('order by desc nulls last', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      order by
        title desc nulls last
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?order=title.desc.nullslast')
  })

  test('cast', async () => {
    const sql = stripIndents`
      select
        pages::float
      from
        books
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=pages::pg_catalog.float8')
  })

  test('cast with alias', async () => {
    const sql = stripIndents`
      select
        pages::float as "partialPages"
      from
        books
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=partialPages:pages::pg_catalog.float8')
  })

  test('cast in where clause fails', async () => {
    const sql = stripIndents`
      select
        pages
      from
        books
      where
        pages::float > 10.0
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('cast in order by clause fails', async () => {
    const sql = stripIndents`
      select
        pages
      from
        books
      order by
        pages::float desc
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })
})
