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

  test('like', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        description like 'Cheese%'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?description=like.Cheese*')
  })

  test('ilike', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        description ilike '%cheese%'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?description=ilike.*cheese*')
  })

  test('match', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        description ~ '^[a-zA-Z]+'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?description=match.%5E[a-zA-Z]%2B')
  })

  test('imatch', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        description ~* '^[a-z]+'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?description=imatch.%5E[a-z]%2B')
  })

  test('in operator', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        category in ('fiction', 'sci-fi')
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?category=in.(fiction,sci-fi)')
  })

  test('in operator with comma', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        category in ('a,b,c', 'd,e,f')
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?category=in.(%22a,b,c%22,%22d,e,f%22)')
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

  test('"and" expression using the same column multiple times', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      where
        pages > 100 and
        pages < 1000
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?pages=gt.100&pages=lt.1000')
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
    expect(fullPath).toBe('/books?select=pages::float')
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
    expect(fullPath).toBe('/books?select=partialPages:pages::float')
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

  test('multiple from relations fail', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books, authors
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('left join', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      left join
        authors
          on author_id = authors.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...authors(name)')
  })

  test('implicit inner join', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on author_id = authors.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...authors!inner(name)')
  })

  test('explicit inner join', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      inner join
        authors
          on author_id = authors.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...authors!inner(name)')
  })

  test('join that is not inner or left fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      right join
        authors
          on author_id = authors.id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join on aliased relation', async () => {
    const sql = stripIndents`
      select
        *,
        a.name
      from
        books
      join
        authors as a
          on author_id = a.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...a:authors!inner(name)')
  })

  test('join using primary relation in qualifier', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on books.author_id = authors.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...authors!inner(name)')
  })

  test('join using alias on primary relation', async () => {
    const sql = stripIndents`
      select
        *,
        a.name
      from
        books b
      join
        authors as a
          on b.author_id = a.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...a:authors!inner(name)')
  })

  // TODO: add support for recursive relationships
  test('join using same relation in qualifier fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on authors.id = authors.another_author_id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join using unknown relation in qualifier fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on movies.author_id = authors.id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join on aliased relation with target on original relation fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors as a
          on author_id = authors.id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('foreign column in target list without join fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join with non-expression qualifier fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on true
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join with left side constant qualifier fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on 1 = authors.id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join with right side constant qualifier fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on author_id = 1
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join with non-equal qualifier operator fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on author_id > authors.id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join nested relations', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on author_id = authors.id
      join
        editors
          on authors.editor_id = editors.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...authors!inner(name,...editors!inner())')
  })

  test('join qualifier missing column from joined relation fails', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on author_id = authors.id
      join
        editors
          on authors.editor_id = author_id
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('join qualifier columns work on either side of equation', async () => {
    const sql = stripIndents`
      select
        *,
        authors.name
      from
        books
      join
        authors
          on authors.id = author_id
      join
        editors
          on editors.id = authors.editor_id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=*,...authors!inner(name,...editors!inner())')
  })

  test('join multiple relations', async () => {
    const sql = stripIndents`
      select
        *,
        author.name
      from
        books
          join authors author
            on author_id = author.id
          join editors editor
            on author.editor_id = editor.id
          join viewers viewer
            on viewer_id = viewer.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe(
      '/books?select=*,...author:authors!inner(name,...editor:editors!inner()),...viewer:viewers!inner()'
    )
  })

  test('select all columns from joined table', async () => {
    const sql = stripIndents`
      select
        author.*
      from
        books
          left join authors author
            on author_id = author.id
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=...author:authors(*)')
  })

  test('select json column', async () => {
    const sql = stripIndents`
      select
        address->'city'->>'name'
      from
        books
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=address->city->>name')
  })

  test('select json column with cast', async () => {
    const sql = stripIndents`
      select
        order_details->'tax_amount'::numeric
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=order_details->tax_amount::numeric')
  })

  test('filter by json column', async () => {
    const sql = stripIndents`
      select
        address->'city'->>'name'
      from
        books
      where
        address->'city'->>'code' = 'SFO'
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/books?select=address->city->>name&address->city->>code=eq.SFO')
  })

  test('aggregate', async () => {
    const sql = stripIndents`
      select
        sum(amount)
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=amount.sum()')
  })

  test('aggregate with alias', async () => {
    const sql = stripIndents`
      select
        sum(amount) as total
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=total:amount.sum()')
  })

  test('aggregate with input cast', async () => {
    const sql = stripIndents`
      select
        sum(amount::float)
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=amount::float.sum()')
  })

  test('aggregate with output cast', async () => {
    const sql = stripIndents`
      select
        sum(amount)::float
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=amount.sum()::float')
  })

  test('aggregate with input and output cast', async () => {
    const sql = stripIndents`
      select
        sum(amount::int)::float
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=amount::int.sum()::float')
  })

  test('unsupported aggregate function fails', async () => {
    const sql = stripIndents`
      select
        custom_sum(amount::int)::float
      from
        orders
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('aggregate on a json target', async () => {
    const sql = stripIndents`
      select
        sum(order_details->'tax_amount'::numeric)
      from
        orders
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=order_details->tax_amount::numeric.sum()')
  })

  test('group by aggregates', async () => {
    const sql = stripIndents`
      select
        sum(amount),
        category
      from
        orders
      group by
        category
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=amount.sum(),category')
  })

  test('group by without select target fails', async () => {
    const sql = stripIndents`
      select
        sum(amount)
      from
        orders
      group by
        category
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('aggregate with another target column but no group by fails', async () => {
    const sql = stripIndents`
      select
        sum(amount),
        category
      from
        orders
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('aggregate with missing group by column fails', async () => {
    const sql = stripIndents`
      select
        sum(amount),
        category,
        name
      from
        orders
      group by
        category
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('group by with having fails', async () => {
    const sql = stripIndents`
      select
        sum(amount),
        category
      from
        orders
      group by
        category
      having sum(amount) > 1000
    `

    await expect(processSql(sql)).rejects.toThrowError()
  })

  test('group by a joined column', async () => {
    const sql = stripIndents`
      select
        sum(amount),
        customer.region
      from
        orders
      join
        customers customer
      on customer_id = customer.id
      group by
        customer.region
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/orders?select=amount.sum(),...customer:customers!inner(region)')
  })

  test('aggregate on a joined column', async () => {
    const sql = stripIndents`
      select
        name,
        avg(orders.amount) as average_spend
      from
        customers
      join
        orders
      on id = orders.customer_id
      group by
        name
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/customers?select=name,...orders!inner(average_spend:amount.avg())')
  })

  test('aliased primary relation in group by', async () => {
    const sql = stripIndents`
      select
        region,
        max(age),
        min(age)
      from
        profiles p
      group by
        p.region
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=region,age.max(),age.min()')
  })

  test('count on column', async () => {
    const sql = stripIndents`
      select
        count(avatar)
      from
        profiles
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=avatar.count()')
  })

  test('count on all rows', async () => {
    const sql = stripIndents`
      select
        count(*)
      from
        profiles
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=count()')
  })

  test('count on all rows with alias', async () => {
    const sql = stripIndents`
      select
        count(*) as total
      from
        profiles
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=total:count()')
  })

  test('count on all rows with cast', async () => {
    const sql = stripIndents`
      select
        count(*)::float
      from
        profiles
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=count()::float')
  })

  test('count on all rows with group by', async () => {
    const sql = stripIndents`
      select
        region,
        count(*)
      from
        profiles
      group by
        region
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=region,count()')
  })

  test('primary relation prefix stripped', async () => {
    const sql = stripIndents`
      select
        profiles.name
      from
        profiles
      where
        profiles.name = 'Bob'
      order by
        profiles.name
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=name&name=eq.Bob&order=name')
  })

  test('primary relation alias prefix stripped', async () => {
    const sql = stripIndents`
      select
        p.name
      from
        profiles p
      where
        p.name = 'Bob'
      order by
        p.name
    `

    const statement = await processSql(sql)
    const { method, fullPath } = await renderHttp(statement)

    expect(method).toBe('GET')
    expect(fullPath).toBe('/profiles?select=name&name=eq.Bob&order=name')
  })
})
