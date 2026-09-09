import { parse } from 'libpg-query'
import { describe, expect, it } from 'vitest'

import {
  getEditableQuery,
  getResultColumnMapping,
  getResultRowIdentifiers,
  updateResultRows,
} from './query-result-editing'

const table = {
  columns: [{ name: 'tenant_id' }, { name: 'id' }, { name: 'name' }],
  primary_keys: [{ name: 'tenant_id' }, { name: 'id' }],
}
const columns = [
  { column: 'tenant_id', name: 'tenant' },
  { column: 'id', name: 'key' },
  { column: 'name', name: 'label' },
]

describe('getEditableQuery', () => {
  it.each([
    'select * from users',
    'select * from public.users where id > 5 order by id desc limit 100 offset 10',
    'select u.* from public.users u',
    'select public.users.* from public.users',
    '/* a comment */ select * from "public"."users";',
    'select * from only public.users',
  ])('recognizes a direct table projection: %s', async (sql) => {
    expect(getEditableQuery(await parse(sql))).toMatchObject({ table: 'users', columns: null })
  })

  it('preserves quoted identifiers and column aliases', async () => {
    expect(
      getEditableQuery(await parse('select u."ID" as "Key", u.name from "My.Schema"."My.Table" u'))
    ).toEqual({
      schema: 'My.Schema',
      table: 'My.Table',
      columns: [
        { column: 'ID', name: 'Key' },
        { column: 'name', name: 'name' },
      ],
    })
  })

  it.each([
    'select 1',
    'select id + 1 as id from users',
    'select id::text from users',
    'select count(*) from users',
    'select id from users group by id',
    'select distinct id from users',
    'select distinct on (id) * from users',
    'select * from users join teams on users.id = teams.id',
    'select users.* from users, teams',
    'select * from (select * from users) u',
    'with u as (select * from users) select * from u',
    'with u as (delete from teams returning *) select * from users',
    'select * from users union select * from teams',
    'select * from users; select * from teams',
    "update users set name = 'new' returning *",
    'delete from users returning *',
    'select * into copied_users from users',
    'select id, id as id from users',
    'select *, id from users',
    'select * from users u(renamed_id)',
    'select * from users tablesample system (10)',
    'select generate_series(1, 10) as id from users',
    'select other.id from users',
    'select wrong.users.id from public.users',
    'select public.users.id from public.users u',
    'select * from users for update',
    'values (1)',
  ])('keeps ambiguous or unsupported queries read-only: %s', async (sql) => {
    expect(getEditableQuery(await parse(sql))).toBeNull()
  })

  it.each([null, {}, { stmts: [] }])('fails closed for malformed ASTs', (ast) => {
    expect(getEditableQuery(ast)).toBeNull()
  })
})

describe('result row identity', () => {
  it('requires every component of a composite primary key', () => {
    expect(getResultColumnMapping({ table: 'users', columns }, table)).toEqual(columns)
    expect(getResultColumnMapping({ table: 'users', columns: columns.slice(1) }, table)).toBeNull()
    expect(
      getResultColumnMapping({ table: 'users', columns }, { ...table, primary_keys: [] })
    ).toBeNull()
  })

  it('expands stars from table metadata and rejects expressions masquerading as columns', () => {
    expect(getResultColumnMapping({ table: 'users', columns: null }, table)).toEqual(
      table.columns.map(({ name }) => ({ name, column: name }))
    )
    expect(
      getResultColumnMapping(
        { table: 'users', columns: [...columns, { name: 'fake', column: 'missing' }] },
        table
      )
    ).toBeNull()
  })

  it('uses original aliased keys, including zero and empty strings', () => {
    expect(getResultRowIdentifiers({ tenant: '', key: 0 }, table, columns)).toEqual({
      tenant_id: '',
      id: 0,
    })
    expect(
      getResultRowIdentifiers({ tenant: 'a', key: '9223372036854775807' }, table, columns)
    ).toEqual({ tenant_id: 'a', id: '9223372036854775807' })
  })

  it.each([null, undefined, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, 1.5, {}, []])(
    'rejects missing, null, lossy, or unsupported keys: %s',
    (key) => {
      expect(getResultRowIdentifiers({ tenant: 'a', key }, table, columns)).toBeNull()
    }
  )

  it('requires own properties and never treats prototype keys as an empty identifier set', () => {
    expect(
      getResultRowIdentifiers(Object.create({ tenant: 'a', key: 1 }), table, columns)
    ).toBeNull()
    const specialTable = { primary_keys: [{ name: '__proto__' }] }
    const specialColumns = [{ name: '__proto__', column: '__proto__' }]
    expect(
      Object.entries(
        getResultRowIdentifiers(JSON.parse('{"__proto__":"value"}'), specialTable, specialColumns)!
      )
    ).toEqual([['__proto__', 'value']])
  })

  it('refreshes all matching projections with server values without confusing composite keys', () => {
    const original = { tenant: 'a', key: 1, label: 'old' }
    const other = { tenant: 'b', key: 1, label: 'unchanged' }
    expect(
      updateResultRows({
        rows: [original, other, { ...original }],
        original,
        updated: { tenant_id: 'a', id: 2, name: 'server value', hidden: 42 },
        columns,
        table,
      })
    ).toEqual([
      { tenant: 'a', key: 2, label: 'server value' },
      other,
      { tenant: 'a', key: 2, label: 'server value' },
    ])
  })

  it('leaves results untouched when the original row has no usable identity', () => {
    const rows = [{ label: 'old' }]
    expect(updateResultRows({ rows, original: rows[0], updated: {}, columns, table })).toBe(rows)
  })
})
