import { describe, expect, test } from '@jest/globals'
import { stripIndent, stripIndents } from 'common-tags'
import { processSql } from '../processor'
import { renderSupabaseJs } from './supabase-js'

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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select('title, description')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select('my_title:title')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .eq('title', 'Cheese')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .neq('title', 'Cheese')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .not('title', 'eq', 'Cheese')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .is('title', null)
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .not('title', 'is', null)
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .gt('pages', 10)
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .gte('pages', 10)
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .lt('pages', 10)
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .lte('pages', 10)
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .eq('title', 'Cheese')
        .ilike('description', '%salsa%')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .or('title.eq.Cheese, title.eq.Salsa')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .or('not.and(title.eq.Cheese, description.ilike.%salsa%)')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .or('not.or(title.eq.Cheese, title.eq.Salsa)')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .like('title', 'T%')
        .or('description.ilike.%tacos%, description.ilike.%salsa%')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .or('not.and(title.like.T%, or(description.ilike.%tacos%, description.ilike.%salsa%))')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .or('not.and(title.like.T%, not.or(description.ilike.%tacos%, description.ilike.%salsa%))')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .or('and(title.like.T%, description.ilike.%tacos%), description.ilike.%salsa%')
    `)
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .limit(5)
    `)
  })

  test('offset without limit fails', async () => {
    const sql = stripIndents`
      select
        *
      from
        books
      offset
        10
    `

    const statement = await processSql(sql)

    expect(() => renderSupabaseJs(statement)).toThrowError()
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
    const { code } = renderSupabaseJs(statement)

    expect(code).toBe(stripIndent`
      const { data, error } = await supabase
        .from('books')
        .select()
        .range(10, 15)
    `)
  })
})
