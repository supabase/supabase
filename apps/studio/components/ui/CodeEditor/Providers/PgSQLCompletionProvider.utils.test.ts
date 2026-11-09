import { describe, expect, it } from 'vitest'

import {
  filterTablesByReferences,
  getFromClauseTables,
  getStatementAtOffset,
  parseTrailingDotIdent,
  resolveTablesForIdent,
} from './PgSQLCompletionProvider.utils'

describe('getFromClauseTables', () => {
  it('returns empty array when there is no FROM clause', () => {
    expect(getFromClauseTables('select 1')).toStrictEqual([])
  })

  it('parses a single table', () => {
    expect(getFromClauseTables('select * from colors where id = 1')).toStrictEqual([
      { name: 'colors', alias: undefined },
    ])
  })

  it('parses a table with an implicit alias (no AS)', () => {
    expect(getFromClauseTables('select * from colors c where c.id = 1')).toStrictEqual([
      { name: 'colors', alias: 'c' },
    ])
  })

  it('parses a table with an explicit AS alias', () => {
    expect(getFromClauseTables('select * from colors as c where c.id = 1')).toStrictEqual([
      { name: 'colors', alias: 'c' },
    ])
  })

  it('parses a schema-qualified table', () => {
    expect(getFromClauseTables('select * from public.colors where id = 1')).toStrictEqual([
      { schema: 'public', name: 'colors', alias: undefined },
    ])
  })

  it('parses a schema-qualified table with an alias', () => {
    expect(getFromClauseTables('select * from public.colors c where c.id = 1')).toStrictEqual([
      { schema: 'public', name: 'colors', alias: 'c' },
    ])
  })

  it('parses multiple comma-separated tables', () => {
    expect(
      getFromClauseTables('select * from colors, shapes where colors.id = shapes.id')
    ).toStrictEqual([
      { name: 'colors', alias: undefined },
      { name: 'shapes', alias: undefined },
    ])
  })

  it('parses quoted identifiers, unquoting the result', () => {
    expect(getFromClauseTables('select * from "Colors" "C" where "C".id = 1')).toStrictEqual([
      { name: 'Colors', alias: 'C' },
    ])
  })

  it('parses tables across inner/left/right/full/cross joins', () => {
    expect(
      getFromClauseTables(
        `select * from colors
         inner join a on a.id = colors.id
         left join b on b.id = colors.id
         left outer join c on c.id = colors.id
         right join d on d.id = colors.id
         full outer join e on e.id = colors.id
         cross join f`
      )
    ).toStrictEqual([
      { name: 'colors', alias: undefined },
      { name: 'a', alias: undefined },
      { name: 'b', alias: undefined },
      { name: 'c', alias: undefined },
      { name: 'd', alias: undefined },
      { name: 'e', alias: undefined },
      { name: 'f', alias: undefined },
    ])
  })

  it('parses a plain JOIN (no join-type keyword)', () => {
    expect(
      getFromClauseTables('select * from colors join shapes on shapes.color_id = colors.id')
    ).toStrictEqual([
      { name: 'colors', alias: undefined },
      { name: 'shapes', alias: undefined },
    ])
  })

  it('is case-insensitive for FROM/JOIN keywords', () => {
    expect(
      getFromClauseTables('SELECT * FROM Colors C INNER JOIN Shapes S ON S.id = C.id')
    ).toStrictEqual([
      { name: 'Colors', alias: 'C' },
      { name: 'Shapes', alias: 'S' },
    ])
  })

  it('skips a subquery table source instead of mis-parsing it', () => {
    expect(getFromClauseTables('select * from (select * from shapes) x')).toStrictEqual([])
  })

  it('still resolves real tables alongside a skipped subquery', () => {
    expect(getFromClauseTables('select * from colors, (select * from shapes) x')).toStrictEqual([
      { name: 'colors', alias: undefined },
    ])
  })

  it('skips a function table source instead of mis-parsing it', () => {
    expect(getFromClauseTables('select * from generate_series(1, 10) g')).toStrictEqual([])
  })

  it('stops the FROM clause at WHERE/GROUP BY/ORDER BY/LIMIT', () => {
    expect(
      getFromClauseTables('select * from colors group by id order by id limit 10')
    ).toStrictEqual([{ name: 'colors', alias: undefined }])
  })
})

describe('getStatementAtOffset', () => {
  it('returns the whole string when there is a single statement', () => {
    const sql = 'select * from colors where id = 1'
    expect(getStatementAtOffset(sql, 10)).toBe(sql)
  })

  it('returns only the statement containing the given offset', () => {
    const sql = 'select * from colors; select * from shapes where id = 1;'
    const offset = sql.indexOf('shapes')
    expect(getStatementAtOffset(sql, offset).trim()).toBe('select * from shapes where id = 1')
  })

  it('returns the first statement when the offset is before any semicolon', () => {
    const sql = 'select * from colors; select * from shapes;'
    const offset = sql.indexOf('colors')
    expect(getStatementAtOffset(sql, offset).trim()).toBe('select * from colors')
  })

  it('does not treat a semicolon inside a single-quoted string as a boundary', () => {
    const sql = "select * from colors where name = 'a;b' and id = 1"
    expect(getStatementAtOffset(sql, sql.length - 1)).toBe(sql)
  })

  it('does not treat a semicolon inside a double-quoted identifier as a boundary', () => {
    const sql = 'select * from "weird;table" where id = 1'
    expect(getStatementAtOffset(sql, sql.length - 1)).toBe(sql)
  })

  it('does not treat a semicolon inside a line comment as a boundary', () => {
    const sql = 'select * from colors -- comment; still comment\nwhere id = 1'
    expect(getStatementAtOffset(sql, sql.length - 1)).toBe(sql)
  })

  it('does not treat a semicolon inside a block comment as a boundary', () => {
    const sql = 'select * from colors /* comment; still comment */ where id = 1'
    expect(getStatementAtOffset(sql, sql.length - 1)).toBe(sql)
  })
})

describe('filterTablesByReferences', () => {
  const tables = [
    { schemaname: 'public', tablename: 'colors' },
    { schemaname: 'public', tablename: 'shapes' },
    { schemaname: 'internal', tablename: 'colors' },
  ]

  it('returns an empty array when there are no references', () => {
    expect(filterTablesByReferences(tables, [])).toStrictEqual([])
  })

  it('matches by table name only when no schema is specified', () => {
    expect(filterTablesByReferences(tables, [{ name: 'colors' }])).toStrictEqual([
      { schemaname: 'public', tablename: 'colors' },
      { schemaname: 'internal', tablename: 'colors' },
    ])
  })

  it('matches by schema and table name when a schema is specified', () => {
    expect(
      filterTablesByReferences(tables, [{ schema: 'internal', name: 'colors' }])
    ).toStrictEqual([{ schemaname: 'internal', tablename: 'colors' }])
  })

  it('is case-insensitive when matching names', () => {
    expect(filterTablesByReferences(tables, [{ schema: 'PUBLIC', name: 'COLORS' }])).toStrictEqual([
      { schemaname: 'public', tablename: 'colors' },
    ])
  })

  it('returns an empty array when no table matches', () => {
    expect(filterTablesByReferences(tables, [{ name: 'nonexistent' }])).toStrictEqual([])
  })
})

describe('parseTrailingDotIdent', () => {
  it('returns null when the text does not end with an identifier and a dot', () => {
    expect(parseTrailingDotIdent('select * from colors where ')).toBeNull()
  })

  it('extracts an unquoted identifier immediately before a trailing dot', () => {
    expect(parseTrailingDotIdent('select * from colors c where c.')).toStrictEqual({
      isQuoted: false,
      name: 'c',
    })
  })

  it('extracts and unquotes a quoted identifier before a trailing dot', () => {
    expect(parseTrailingDotIdent('select * from "Colors" "C" where "C".')).toStrictEqual({
      isQuoted: true,
      name: 'C',
    })
  })

  it('allows whitespace between the identifier and the dot', () => {
    expect(parseTrailingDotIdent('select * from colors c where c .')).toStrictEqual({
      isQuoted: false,
      name: 'c',
    })
  })
})

describe('resolveTablesForIdent', () => {
  const tables = [
    { schemaname: 'public', tablename: 'orders' },
    { schemaname: 'public', tablename: 'customers' },
  ]

  it('resolves an alias to its table, ignoring other referenced tables', () => {
    const refs = [
      { name: 'orders', alias: 'o' },
      { name: 'customers', alias: 'c' },
    ]
    expect(resolveTablesForIdent(tables, refs, { isQuoted: false, name: 'c' })).toStrictEqual([
      { schemaname: 'public', tablename: 'customers' },
    ])
  })

  it('resolves a plain table name when there is no alias', () => {
    const refs = [{ name: 'customers', alias: undefined }]
    expect(
      resolveTablesForIdent(tables, refs, { isQuoted: false, name: 'customers' })
    ).toStrictEqual([{ schemaname: 'public', tablename: 'customers' }])
  })

  it('does not fall back to the table name once it has an alias', () => {
    const refs = [{ name: 'customers', alias: 'c' }]
    expect(
      resolveTablesForIdent(tables, refs, { isQuoted: false, name: 'customers' })
    ).toStrictEqual([])
  })

  it('returns an empty array when the ident matches nothing', () => {
    const refs = [{ name: 'customers', alias: 'c' }]
    expect(resolveTablesForIdent(tables, refs, { isQuoted: false, name: 'x' })).toStrictEqual([])
  })
})
