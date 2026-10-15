import { safeSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { capReadQuery } from './cap-read-query'

describe('capReadQuery', () => {
  it('appends a limit when applyAutoLimit can', () => {
    expect(capReadQuery(safeSql`select * from users`, 101)).toEqual({
      sql: 'select * from users limit 101;',
      isCappedInDatabase: true,
    })
  })

  it('wraps queries with an explicit large LIMIT', () => {
    const { sql, isCappedInDatabase } = capReadQuery(
      safeSql`select * from users limit 1000000;`,
      101
    )
    expect(isCappedInDatabase).toBe(true)
    expect(sql).toBe(
      'select * from (\nselect * from users limit 1000000\n) as capped_result limit 101;'
    )
  })

  it('wraps queries with LIMIT ALL instead of appending a second limit', () => {
    const { sql, isCappedInDatabase } = capReadQuery(safeSql`select * from users limit all`, 101)
    expect(isCappedInDatabase).toBe(true)
    expect(sql).toBe(
      'select * from (\nselect * from users limit all\n) as capped_result limit 101;'
    )
  })

  it('wraps FETCH FIRST and CTE queries', () => {
    expect(
      capReadQuery(safeSql`select * from users fetch first 5000 rows only`, 101).isCappedInDatabase
    ).toBe(true)
    expect(
      capReadQuery(safeSql`with t as (select 1) select * from t`, 101).isCappedInDatabase
    ).toBe(true)
  })

  it('keeps a trailing line comment from swallowing the closing paren', () => {
    const { sql } = capReadQuery(safeSql`select * from users limit 5000 -- all`, 101)
    expect(sql).toContain('-- all\n)')
  })

  it('ignores keywords and semicolons inside literals and comments', () => {
    for (const q of [
      safeSql`select * from t where note = 'please update; into' limit 5000`,
      safeSql`select "update", $$delete;$$ from t limit 5000 -- insert`,
      safeSql`select * from t /* for update */ limit 5000`,
    ]) {
      expect(capReadQuery(q, 101).isCappedInDatabase).toBe(true)
    }
  })

  it('still rejects writes that follow a literal', () => {
    const q = safeSql`with d as (delete from t where a = 'x' returning *) select * from d`
    expect(capReadQuery(q, 101)).toEqual({ sql: q, isCappedInDatabase: false })
  })

  it('leaves multiple statements and writes untouched', () => {
    for (const q of [
      safeSql`select 1; select 2`,
      safeSql`with d as (delete from t returning *) select * from d`,
      safeSql`with t as (select 1) select * into new_t from t`,
      safeSql`with t as (select 1) select * from t for update`,
      safeSql`insert into t values (1)`,
    ]) {
      expect(capReadQuery(q, 101)).toEqual({ sql: q, isCappedInDatabase: false })
    }
  })
})
