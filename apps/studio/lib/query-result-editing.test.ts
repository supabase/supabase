import { parse } from 'libpg-query'
import { describe, expect, it } from 'vitest'

import {
  applyPendingCellEdits,
  getEditableQuery,
  getEditedRows,
  getResultColumnMapping,
  getResultRowIdentifiers,
  replaceResultRows,
  stagePendingCellEdit,
  type PendingCellEdit,
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
      replaceResultRows({
        rows: [original, other, { ...original }],
        replacements: [
          {
            table: { id: tableId },
            rowIdentifiers: { tenant_id: 'a', id: 1 },
            row: { tenant_id: 'a', id: 2, name: 'server value', hidden: 42 },
          },
        ],
        columns,
        table: { ...table, id: tableId },
      })
    ).toEqual([
      { tenant: 'a', key: 2, label: 'server value' },
      other,
      { tenant: 'a', key: 2, label: 'server value' },
    ])
  })

  it('never copies a row read from another table into this result', () => {
    const rows = [{ tenant: 'a', key: 1, label: 'old' }]
    expect(
      replaceResultRows({
        rows,
        replacements: [
          {
            table: { id: tableId + 1 },
            rowIdentifiers: { tenant_id: 'a', id: 1 },
            row: { tenant_id: 'a', id: 1, name: 'other table' },
          },
        ],
        columns,
        table: { ...table, id: tableId },
      })
    ).toBe(rows)
  })
})

const tableId = 7
const edit = (overrides: Partial<PendingCellEdit> = {}): PendingCellEdit => ({
  table: { id: tableId, schema: 'public', name: 'users' },
  rowIdentifiers: { tenant_id: 'a', id: 1 },
  columnName: 'name',
  oldValue: 'old',
  newValue: 'new',
  ...overrides,
})

describe('staged cell edits', () => {
  it('keeps one edit per cell, so the last value typed is the one saved', () => {
    const edits = stagePendingCellEdit([edit()], edit({ oldValue: 'new', newValue: 'newer' }))
    expect(edits).toEqual([edit({ newValue: 'newer' })])
  })

  it('drops an edit typed back to the database value, so no pointless write is staged', () => {
    expect(stagePendingCellEdit([edit()], edit({ oldValue: 'new', newValue: 'old' }))).toEqual([])
    expect(stagePendingCellEdit([], edit({ newValue: 'old' }))).toEqual([])
  })

  it('compares JSON values by content, since an editor hands back a fresh object', () => {
    const jsonEdit = edit({ columnName: 'meta', oldValue: { a: 1 }, newValue: { a: 2 } })
    expect(stagePendingCellEdit([jsonEdit], { ...jsonEdit, newValue: { a: 1 } })).toEqual([])
  })

  it('shows staged values on every projection of the edited column and leaves other rows alone', () => {
    const rows = [
      { tenant: 'a', key: 1, label: 'old', copy: 'old' },
      { tenant: 'b', key: 1, label: 'old', copy: 'old' },
    ]
    const shown = applyPendingCellEdits({
      rows,
      edits: [edit()],
      columns: [...columns, { column: 'name', name: 'copy' }],
      table: { ...table, id: tableId },
    })
    expect(shown.rows).toEqual([{ tenant: 'a', key: 1, label: 'new', copy: 'new' }, rows[1]])
    expect(shown.editedColumns.get(shown.rows[0])).toEqual(new Set(['label', 'copy']))
    expect(shown.editedColumns.has(shown.rows[1])).toBe(false)
  })

  it('ignores edits staged against another table, such as before the query changed', () => {
    const rows = [{ tenant: 'a', key: 1, label: 'old' }]
    expect(
      applyPendingCellEdits({
        rows,
        edits: [edit({ table: { id: tableId + 1, schema: 'public', name: 'other' } })],
        columns,
        table: { ...table, id: tableId },
      }).rows
    ).toBe(rows)
  })

  it('reads a row back by its new key when the key itself was edited', () => {
    expect(getEditedRows([edit(), edit({ columnName: 'id', oldValue: 1, newValue: 5 })])).toEqual([
      {
        table: edit().table,
        rowIdentifiers: { tenant_id: 'a', id: 1 },
        savedIdentifiers: { tenant_id: 'a', id: 5 },
      },
    ])
  })
})
