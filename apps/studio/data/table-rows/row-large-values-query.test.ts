import { describe, expect, it } from 'vitest'

import { getRowLargeValuesSql, MAX_ROW_LARGE_VALUE_BYTES } from './row-large-values-query'

describe('getRowLargeValuesSql', () => {
  const table = { schema: 'public', name: 'posts' }

  it('selects each column as NULL when it exceeds the size limit', () => {
    const sql = getRowLargeValuesSql({ table, columns: ['body', 'meta'], pkMatch: { id: 1 } })

    expect(sql).toContain(
      `case when octet_length(body::text) > ${MAX_ROW_LARGE_VALUE_BYTES} then null else body end as body`
    )
    expect(sql).toContain(
      `case when octet_length(meta::text) > ${MAX_ROW_LARGE_VALUE_BYTES} then null else meta end as meta`
    )
  })

  it('selects from the qualified table and matches on the primary key', () => {
    const sql = getRowLargeValuesSql({ table, columns: ['body'], pkMatch: { id: 1 } })

    expect(sql).toContain('from public.posts')
    expect(sql).toContain('where id = 1')
  })

  it('matches on every primary key column', () => {
    const sql = getRowLargeValuesSql({
      table,
      columns: ['body'],
      pkMatch: { org_id: 7, id: 1 },
    })

    expect(sql).toContain('where org_id = 7 and id = 1')
  })

  it('quotes column names that need it', () => {
    const sql = getRowLargeValuesSql({ table, columns: ['Body'], pkMatch: { id: 1 } })

    expect(sql).toContain(
      `case when octet_length("Body"::text) > ${MAX_ROW_LARGE_VALUE_BYTES} then null else "Body" end as "Body"`
    )
  })

  it('quotes identifiers so column names cannot inject SQL', () => {
    const sql = getRowLargeValuesSql({
      table,
      columns: ['body"; drop table posts; --'],
      pkMatch: { id: 1 },
    })

    expect(sql).toContain('"body""; drop table posts; --"')
  })

  it('escapes primary key values as literals', () => {
    const sql = getRowLargeValuesSql({
      table,
      columns: ['body'],
      pkMatch: { slug: "x'; drop table posts; --" },
    })

    expect(sql).toContain("'x''; drop table posts; --'")
  })
})
