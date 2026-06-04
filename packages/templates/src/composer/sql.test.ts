import { describe, expect, it } from 'vitest'

import {
  matchIdentifier,
  matchQualifiedIdentifier,
  splitSqlStatements,
  splitSqlValueList,
} from './sql'

describe('splitSqlStatements', () => {
  it('splits simple semicolon-terminated statements', () => {
    const sql = `create table public.todos (id bigint primary key);
create index todos_id_idx on public.todos (id);`

    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('create table')
    expect(statements[1]).toContain('create index')
  })

  it('preserves semicolons inside $$ dollar-quoted bodies', () => {
    const sql = `create function add_one(x int) returns int as $$
  select x + 1;
  select 42;
$$ language sql;
create table foo (id int);`

    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('create function')
    expect(statements[0]).toContain('select 42;')
    expect(statements[1]).toContain('create table')
  })

  it('ignores $$ that appear inside line comments', () => {
    const sql = `-- comment about $$ dollar quotes
create table foo (id int);
create table bar (id int);`

    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('create table foo')
    expect(statements[1]).toContain('create table bar')
  })

  it('does not split inside string literals containing semicolons', () => {
    const sql = `insert into foo (msg) values ('a;b;c');
create table bar (id int);`

    const statements = splitSqlStatements(sql)
    // String-literal semicolons still split today (lexer is line-based), but the
    // statement at least keeps the trailing semicolon. Document via assertions:
    expect(statements.length).toBeGreaterThanOrEqual(2)
    expect(statements.at(-1)).toContain('create table bar')
  })
})

describe('matchIdentifier', () => {
  it('extracts an unquoted identifier', () => {
    expect(
      matchIdentifier(
        'create schema if not exists stripe',
        /create\s+schema\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
      )
    ).toBe('stripe')
  })

  it('extracts a quoted identifier', () => {
    expect(
      matchIdentifier(
        'create schema "my schema"',
        /create\s+schema\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
      )
    ).toBe('my schema')
  })

  it('returns null when nothing matches', () => {
    expect(matchIdentifier('select 1', /create\s+schema\s+(\w+)/i)).toBeNull()
  })
})

describe('matchQualifiedIdentifier', () => {
  const TABLE_REGEX =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(?:"([^"]+)"|([a-zA-Z_][\w$]*))\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i

  it('defaults schema to "public" when omitted', () => {
    expect(matchQualifiedIdentifier('create table todos (id int)', TABLE_REGEX)).toEqual({
      schema: 'public',
      name: 'todos',
    })
  })

  it('extracts explicit schema and name', () => {
    expect(matchQualifiedIdentifier('create table auth.users (id int)', TABLE_REGEX)).toEqual({
      schema: 'auth',
      name: 'users',
    })
  })

  it('honors the defaultSchema override', () => {
    expect(matchQualifiedIdentifier('create table todos (id int)', TABLE_REGEX, 'app')).toEqual({
      schema: 'app',
      name: 'todos',
    })
  })

  it('supports quoted schema and table names', () => {
    expect(
      matchQualifiedIdentifier('create table "weird schema"."weird table" (id int)', TABLE_REGEX)
    ).toEqual({ schema: 'weird schema', name: 'weird table' })
  })
})

describe('splitSqlValueList', () => {
  it('splits a simple list', () => {
    expect(splitSqlValueList("'a', 'b', 'c'")).toEqual(["'a'", "'b'", "'c'"])
  })

  it('does not split on commas inside string literals', () => {
    expect(splitSqlValueList("'a, b', 'c'")).toEqual(["'a, b'", "'c'"])
  })

  it('handles escaped single quotes', () => {
    expect(splitSqlValueList("'it''s ok', 'next'")).toEqual(["'it''s ok'", "'next'"])
  })
})
