import {
  asWriteSql,
  joinSqlFragments,
  safeSql,
  type SafeSqlFragment,
  type WriteSqlFragment,
} from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { executeSql, useExecuteSqlMutation } from './execute-sql-mutation'
import { unguarded } from '@/data/guarded-fetch'
import { testGrant } from '@/tests/lib/test-grant'

const PG_META_QUERY = 'POST /platform/pg-meta/{ref}/query'
const readGrant = testGrant(PG_META_QUERY, { variant: 'read' })
const writeGrant = testGrant(PG_META_QUERY, { variant: 'write' })
const base = { projectRef: 'proj', sqlOrigin: 'user' } as const

describe('executeSql types', () => {
  const plain = safeSql`select 1`
  const write = asWriteSql(safeSql`drop table t`)
  const plainGrant = testGrant(PG_META_QUERY)
  type Foo = { id: number }[]

  it('accepts read SQL with a read grant, a write grant, or unguarded', () => {
    void (() => executeSql({ ...base, sql: plain, grant: readGrant }))
    void (() => executeSql({ ...base, sql: plain, grant: writeGrant }))
    void (() => executeSql({ ...base, sql: plain, grant: unguarded.byDesign('test') }))
  })

  it('accepts write SQL with a write grant or unguarded', () => {
    void (() => executeSql({ ...base, sql: write, grant: writeGrant }))
    void (() => executeSql({ ...base, sql: write, grant: unguarded.byDesign('test') }))
  })

  it('rejects write SQL with a read grant or a variant-less grant', () => {
    // @ts-expect-error write SQL with a read grant
    void (() => executeSql({ ...base, sql: write, grant: readGrant }))
    // @ts-expect-error write SQL with a plain grant
    void (() => executeSql({ ...base, sql: write, grant: plainGrant }))
  })

  it('rejects a plain grant and a missing grant for read SQL', () => {
    // @ts-expect-error plain grant where a variant is required
    void (() => executeSql({ ...base, sql: plain, grant: plainGrant }))
    // @ts-expect-error grant is required
    void (() => executeSql({ ...base, sql: plain }))
  })

  it('keeps an explicit result type working', () => {
    void (() => executeSql<Foo>({ ...base, sql: plain, grant: readGrant }))
    void (() => executeSql<Foo>({ ...base, sql: write, grant: writeGrant }))
    // @ts-expect-error write SQL with a read grant
    void (() => executeSql<Foo>({ ...base, sql: write, grant: readGrant }))
  })

  it('applies the same rules to mutation variables', () => {
    const useMutate = () => useExecuteSqlMutation().mutate
    void (() => useMutate()({ ...base, sql: plain, grant: readGrant }))
    void (() => useMutate()({ ...base, sql: write, grant: writeGrant }))
    // @ts-expect-error write SQL with a read grant
    void (() => useMutate()({ ...base, sql: write, grant: readGrant }))
  })
})

type IsWrite<T> = [T] extends [WriteSqlFragment] ? true : false
const assertType = <_T extends true>() => {}

describe('SQL composition keeps the write brand', () => {
  const plain = safeSql`select 1`
  const write = asWriteSql(safeSql`drop table t`)

  it('safeSql with a write interpolation is a WriteSqlFragment', () => {
    const sql = safeSql`begin; ${write}; commit;`
    assertType<IsWrite<typeof sql>>()
    // @ts-expect-error write SQL with a read grant
    void (() => executeSql({ ...base, sql, grant: readGrant }))
    void (() => executeSql({ ...base, sql, grant: writeGrant }))
  })

  it('safeSql with a mix of plain and write interpolations is a WriteSqlFragment', () => {
    const sql = safeSql`${plain}; ${write}`
    assertType<IsWrite<typeof sql>>()
  })

  it('safeSql with only plain fragments stays plain', () => {
    const sql = safeSql`select ${plain}`
    assertType<IsWrite<typeof sql> extends false ? true : false>()
    const asPlain: SafeSqlFragment = sql
    void asPlain
    void (() => executeSql({ ...base, sql, grant: readGrant }))
  })

  it('safeSql without interpolation is plain', () => {
    const sql = safeSql`select 1`
    assertType<IsWrite<typeof sql> extends false ? true : false>()
    void (() => executeSql({ ...base, sql, grant: readGrant }))
  })

  it('joinSqlFragments is write if any fragment writes', () => {
    const joined = joinSqlFragments([plain, write], ',')
    assertType<IsWrite<typeof joined>>()
    // @ts-expect-error write SQL with a read grant
    void (() => executeSql({ ...base, sql: joined, grant: readGrant }))
  })

  it('joinSqlFragments of plain fragments is plain', () => {
    const joined = joinSqlFragments([plain, plain], ',')
    assertType<IsWrite<typeof joined> extends false ? true : false>()
    void (() => executeSql({ ...base, sql: joined, grant: readGrant }))
  })

  it('joinSqlFragments of Array<SafeSqlFragment> is plain', () => {
    const list: Array<SafeSqlFragment> = [plain]
    const joined = joinSqlFragments(list, ',')
    assertType<IsWrite<typeof joined> extends false ? true : false>()
  })

  it('preserves the brand at runtime', () => {
    expect(safeSql`a ${write} b`).toBe('a drop table t b')
    expect(joinSqlFragments([plain, write], ',')).toBe('select 1,drop table t')
  })
})
