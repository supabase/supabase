import { stripIndent } from 'common-tags'
import { describe, expect, it, test } from 'vitest'

import {
  appendEnableRLSStatements,
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  hasActiveEnsureRLSTrigger,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import type { DatabaseEventTrigger } from '@/data/database-event-triggers/database-event-triggers-query'

const buildTrigger = (overrides: Partial<DatabaseEventTrigger> = {}): DatabaseEventTrigger => ({
  oid: 1,
  name: 'ensure_rls',
  event: 'ddl_command_end',
  enabled_mode: 'ORIGIN',
  tags: ['CREATE TABLE'],
  function_name: 'rls_auto_enable',
  function_schema: 'public',
  owner: 'postgres',
  function_definition: null,
  ...overrides,
})

describe('SQLEditor.utils.ts:checkIfAppendLimitRequired', () => {
  test('Should return false if limit passed is <= 0', () => {
    const sql = 'select * from countries;'
    const limit = -1
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return true if limit passed is > 0', () => {
    const sql = 'select * from countries;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(true)
  })
  test('Should return false if query already has a limit', () => {
    const sql = 'select * from countries limit 10;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit (check for case-insensitiveness)', () => {
    const sql = 'SELECT * FROM countries LIMIT 10;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset', () => {
    const sql = 'select * from countries limit 10 offset 0;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset (flip order of limit and offset)', () => {
    const sql = 'select * from countries offset 0 limit 1;'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit, even if no value provided for limit', () => {
    const sql = 'select * from countries limit'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `FETCH FIRST` instead of limit ', () => {
    const sql = 'select * from countries FETCH FIRST 5 rows only'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch first` instead of limit ', () => {
    const sql = 'select * from countries fetch first 5 rows only'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch   first` (with random spaces) instead of limit ', () => {
    const sql = 'select * from countries FETCH FIRST 5 rows only'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query is not a select statement', () => {
    const sql = 'create table test (id int8 primary key, name varchar);'
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries I', () => {
    const sql1 = `
select * from countries;
select * from cities;
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries II', () => {
    const sql1 = `
select * from countries;
select * from cities
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  // [Joshen] Opting to just avoid appending in this case to prevent making the logic overly complex atm
  test('Should return false if query has with a comment I', () => {
    const sql = `
-- This is a comment
select * from cities
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query has with a comment II', () => {
    const sql = `
select * from cities
-- This is a comment
`.trim()
    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
})

// [Joshen] These will just need to test the cases when appendAutoLimit returns true then
describe('SQLEditor.utils.ts:suffixWithLimit', () => {
  test('Should add the limit param properly if query ends without a semi colon', () => {
    const sql = 'select * from countries'
    const limit = 100
    const formattedSql = suffixWithLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with a semi colon', () => {
    const sql = 'select * from countries;'
    const limit = 100
    const formattedSql = suffixWithLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with multiple semi colon', () => {
    const sql = 'select * from countries;;;;;;;'
    const limit = 100
    const formattedSql = suffixWithLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
})

describe(`SQLEditor.utils.ts:checkDestructiveQuery`, () => {
  it('drop statement matches', () => {
    const match = checkDestructiveQuery('drop table films, distributors;')

    expect(match).toBe(true)
  })

  it('truncate statement matches', () => {
    const match = checkDestructiveQuery('truncate films;')

    expect(match).toBe(true)
  })

  it('delete statement matches', () => {
    const match = checkDestructiveQuery("delete from films where kind <> 'Musical';")

    expect(match).toBe(true)
  })

  it('delete statement after another statement matches', () => {
    const match = checkDestructiveQuery(stripIndent`
      select * from films;

      delete from films where kind <> 'Musical';
    `)

    expect(match).toBe(true)
  })

  it("rls policy containing delete doesn't match", () => {
    const match = checkDestructiveQuery(stripIndent`
      create policy "Users can delete their own files"
      on storage.objects for delete to authenticated using (
        bucket id = 'files' and (select auth.uid()) = owner
      );
    `)

    expect(match).toBe(false)
  })

  it('capitalized statement matches', () => {
    const match = checkDestructiveQuery("DELETE FROM films WHERE kind <> 'Musical';")

    expect(match).toBe(true)
  })

  it("comment containing keyword doesn't match", () => {
    const match = checkDestructiveQuery(stripIndent`
      -- Going to drop this in here, might delete later
      select * from films;
    `)

    expect(match).toBe(false)
  })
})

describe('SQLEditor.utils:updateWithoutWhere', () => {
  it('contains an update query with a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE public.countries SET name = 'New Name' WHERE id = 1;
    `)

    expect(match).toBe(false)
  })

  it('contains an update query without a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE public.countries SET name = 'New Name';
    `)

    expect(match).toBe(true)
  })

  it('contains an update query, with quoted identifiers with a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE "public"."countries" SET name = 'New Name' WHERE id = 1;
    `)

    expect(match).toBe(false)
  })

  it('contains an update query, with quoted identifiers without a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE "public"."countries" SET name = 'New Name';
    `)

    expect(match).toBe(true)
  })

  it('catches update on a single quoted table name without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "messages" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('does not flag update on a single quoted table name with a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "messages" SET id = 1 WHERE id = 2;`)
    expect(match).toBe(false)
  })

  it('catches update on a quoted schema with a bareword table without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "public".messages SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update on a bareword schema with a quoted table without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE public."messages" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update on a quoted table name containing a space without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "my table" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update on a quoted table name containing escaped quotes without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "weird""name" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update where a quoted identifier contains the word where', () => {
    const match = isUpdateWithoutWhere(`UPDATE "where table" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update where a string literal contains the word where', () => {
    const match = isUpdateWithoutWhere(`UPDATE messages SET name = 'where x';`)
    expect(match).toBe(true)
  })

  it('does not flag update where the only "where" sits inside a string literal but a real where clause exists', () => {
    const match = isUpdateWithoutWhere(`UPDATE messages SET name = 'where x' WHERE id = 1;`)
    expect(match).toBe(false)
  })

  it('contains both an update query and a delete query, triggers destructive', () => {
    const match = checkDestructiveQuery(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })

  it('contains both an update query and a delete query, triggers no where', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })
  it('contains both an update query and a delete query, triggers no where', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })

  it('should catch potential destructive queries', () => {
    const DESTRUCTIVE_QUERIES = [
      `ALTER TABLE test DROP COLUMN test;`,
      `DELETE FROM test;`,
      `DROP TABLE test;`,
      `TRUNCATE TABLE test;`,
    ]

    DESTRUCTIVE_QUERIES.forEach((query) => {
      expect(checkDestructiveQuery(query), `Query ${query} should be destructive`).toBe(true)
    })
  })
})

describe('SQLEditor.utils:getCreateTablesMissingRLS', () => {
  it('flags a basic CREATE TABLE without RLS', () => {
    const result = getCreateTablesMissingRLS('create table foo (id int8 primary key);')
    expect(result).toEqual([{ schema: undefined, tableName: 'foo' }])
  })

  it('flags CREATE TABLE IF NOT EXISTS', () => {
    const result = getCreateTablesMissingRLS(
      'create table if not exists foo (id int8 primary key);'
    )
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('foo')
  })

  it('flags schema-qualified CREATE TABLE', () => {
    const result = getCreateTablesMissingRLS('create table public.foo (id int8 primary key);')
    expect(result).toEqual([{ schema: 'public', tableName: 'foo' }])
  })

  it('flags quoted identifiers', () => {
    const result = getCreateTablesMissingRLS(
      'create table "public"."user_table" (id int8 primary key);'
    )
    expect(result).toEqual([{ schema: 'public', tableName: 'user_table' }])
  })

  it('flags quoted identifiers containing spaces', () => {
    const result = getCreateTablesMissingRLS(
      'create table "public"."My Table" (id int8 primary key);'
    )
    expect(result).toEqual([{ schema: 'public', tableName: 'My Table' }])
  })

  it('matches RLS to a table whose name contains spaces', () => {
    const sql = stripIndent`
      create table "My Table" (id int8 primary key);
      alter table "My Table" enable row level security;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when ENABLE ROW LEVEL SECURITY is in the same SQL', () => {
    const sql = stripIndent`
      create table foo (id int8 primary key);
      alter table foo enable row level security;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when ENABLE RLS shorthand is in the same SQL', () => {
    const sql = stripIndent`
      create table foo (id int8 primary key);
      alter table foo enable rls;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('matches RLS to the right table when multiple tables created', () => {
    const sql = stripIndent`
      create table foo (id int8 primary key);
      create table bar (id int8 primary key);
      alter table foo enable row level security;
    `
    const result = getCreateTablesMissingRLS(sql)
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('bar')
  })

  it('does not flag when CREATE TABLE is inside a comment', () => {
    const sql = stripIndent`
      -- create table foo (id int8 primary key);
      select 1;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when there is no CREATE TABLE at all', () => {
    expect(getCreateTablesMissingRLS('select * from foo;')).toEqual([])
  })

  it('schema-qualified RLS matches schema-qualified CREATE', () => {
    const sql = stripIndent`
      create table public.foo (id int8 primary key);
      alter table public.foo enable row level security;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('flags CREATE TEMP TABLE', () => {
    const result = getCreateTablesMissingRLS('create temp table foo (id int8 primary key);')
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('foo')
  })

  it('does not flag `select ... into var` inside a plpgsql function body', () => {
    // Regression: the SELECT..INTO detector used to match variable assignments
    // inside $$...$$ function bodies and surface them as \"new tables\".
    const sql = stripIndent`
      create or replace function schema_checks()
      returns jsonb
      language plpgsql
      as $$
      declare
        ret jsonb;
      begin
        select jsonb_build_object('value', 'ok')
        into ret;
        return ret;
      end;
      $$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag `select ... into var` inside a DO block', () => {
    const sql = stripIndent`
      do $$
      declare
        result int;
      begin
        select count(*) into result from information_schema.tables;
      end
      $$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag CREATE TABLE text that appears inside a function body', () => {
    const sql = stripIndent`
      create or replace function noop()
      returns void
      language plpgsql
      as $$
      begin
        -- create table foo (id int);
        perform 1;
      end;
      $$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('flags top-level CREATE TABLE alongside a function with INTO assignments', () => {
    const sql = stripIndent`
      create table public.foo (id int8 primary key);
      create or replace function bar()
      returns int
      language plpgsql
      as $$
      declare
        v int;
      begin
        select 1 into v;
        return v;
      end;
      $$;
    `
    const result = getCreateTablesMissingRLS(sql)
    expect(result).toEqual([{ schema: 'public', tableName: 'foo' }])
  })

  it('does not flag CREATE TABLE inside nested dollar-quoted dynamic SQL', () => {
    // Regression: the `$sql$...$sql$` block inside the outer `$fn$...$fn$`
    // body was previously pairing with the outer tag, letting the inner
    // semicolon split the statement and exposing `create table fake` to the
    // RLS warning.
    const sql = stripIndent`
      create function f()
      returns void
      language plpgsql
      as $fn$
      begin
        execute $sql$create table fake(id int);$sql$;
      end;
      $fn$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('handles custom dollar-quote tags (e.g. $body$...$body$)', () => {
    const sql = stripIndent`
      create or replace function f()
      returns int
      language plpgsql
      as $body$
      declare
        v int;
      begin
        select 1 into v;
        return v;
      end;
      $body$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not collide quoted identifiers that differ only by case', () => {
    // "MyTable" and "mytable" are distinct tables in Postgres, so the ALTER
    // here targets a different table than the CREATE — the warning must fire.
    const sql = stripIndent`
      create table "MyTable" (id int8 primary key);
      alter table "mytable" enable row level security;
    `
    const result = getCreateTablesMissingRLS(sql)
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('MyTable')
  })
})

describe('SQLEditor.utils:appendEnableRLSStatements', () => {
  it('appends a single ALTER TABLE ENABLE RLS statement', () => {
    const result = appendEnableRLSStatements('create table foo (id int8 primary key);', [
      { tableName: 'foo' },
    ])
    expect(result).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
  })

  it('appends one ALTER per table', () => {
    const result = appendEnableRLSStatements(
      'create table foo (id int8); create table bar (id int8);',
      [{ tableName: 'foo' }, { tableName: 'bar' }]
    )
    expect(result).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
    expect(result).toContain('ALTER TABLE bar ENABLE ROW LEVEL SECURITY;')
  })

  it('schema-qualifies the table when schema is provided', () => {
    const result = appendEnableRLSStatements('create table public.foo (id int8);', [
      { schema: 'public', tableName: 'foo' },
    ])
    expect(result).toContain('ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;')
  })

  it('quotes identifiers that are not simple', () => {
    const result = appendEnableRLSStatements('create table "My Table" (id int8);', [
      { tableName: 'My Table' },
    ])
    expect(result).toContain('ALTER TABLE "My Table" ENABLE ROW LEVEL SECURITY;')
  })

  it('quotes mixed-case identifiers so Postgres does not fold them to lowercase', () => {
    const result = appendEnableRLSStatements('create table "MyTable" (id int8);', [
      { tableName: 'MyTable' },
    ])
    expect(result).toContain('ALTER TABLE "MyTable" ENABLE ROW LEVEL SECURITY;')
  })

  it('quotes mixed-case schema and table identifiers', () => {
    const result = appendEnableRLSStatements('create table "MySchema"."MyTable" (id int8);', [
      { schema: 'MySchema', tableName: 'MyTable' },
    ])
    expect(result).toContain('ALTER TABLE "MySchema"."MyTable" ENABLE ROW LEVEL SECURITY;')
  })

  it('returns the original SQL unchanged when there are no tables', () => {
    const sql = 'select 1;'
    expect(appendEnableRLSStatements(sql, [])).toBe(sql)
  })

  it('puts the terminator on its own line when SQL ends with a line comment', () => {
    // Without this, the appended ';' would be swallowed by the line comment and
    // the following ALTER TABLE would be parsed as part of the CREATE TABLE.
    const sql = stripIndent`
      create table foo (id int)
      -- forgot the semicolon
    `
    const result = appendEnableRLSStatements(sql, [{ tableName: 'foo' }])
    expect(result).toMatch(/-- forgot the semicolon\n;\n/)
    expect(result).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
  })
})

describe('SQLEditor.utils:hasActiveEnsureRLSTrigger', () => {
  it('returns false for undefined triggers', () => {
    expect(hasActiveEnsureRLSTrigger(undefined)).toBe(false)
  })

  it('returns false for an empty list', () => {
    expect(hasActiveEnsureRLSTrigger([])).toBe(false)
  })

  it('returns true when a trigger named "ensure_rls" is active', () => {
    expect(hasActiveEnsureRLSTrigger([buildTrigger()])).toBe(true)
  })

  it('returns true when a trigger uses the rls_auto_enable function (renamed trigger)', () => {
    expect(
      hasActiveEnsureRLSTrigger([
        buildTrigger({ name: 'something_else', function_name: 'rls_auto_enable' }),
      ])
    ).toBe(true)
  })

  it('returns false when the matching trigger is DISABLED', () => {
    expect(hasActiveEnsureRLSTrigger([buildTrigger({ enabled_mode: 'DISABLED' })])).toBe(false)
  })

  it('ignores unrelated triggers', () => {
    expect(
      hasActiveEnsureRLSTrigger([buildTrigger({ name: 'audit_log', function_name: 'log_changes' })])
    ).toBe(false)
  })
})

describe('SQLEditor.utils:filterTablesCoveredByEnsureRLSTrigger', () => {
  it('returns the input unchanged when the trigger is not present', () => {
    const tables = [{ tableName: 'foo' }, { schema: 'private', tableName: 'bar' }]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, false)).toEqual(tables)
  })

  it('drops public-schema tables when the trigger is present', () => {
    const tables = [
      { schema: 'public', tableName: 'foo' },
      { tableName: 'bar' }, // no schema → defaults to public
    ]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, true)).toEqual([])
  })

  it('keeps tables in non-public schemas when the trigger is present', () => {
    const tables = [
      { schema: 'public', tableName: 'foo' },
      { schema: 'private', tableName: 'bar' },
      { schema: 'app', tableName: 'baz' },
    ]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, true)).toEqual([
      { schema: 'private', tableName: 'bar' },
      { schema: 'app', tableName: 'baz' },
    ])
  })

  it('matches the public schema case-insensitively', () => {
    const tables = [{ schema: 'PUBLIC', tableName: 'foo' }]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, true)).toEqual([])
  })
})

describe('SQLEditor.utils:checkAlterDatabaseConnection', () => {
  it('detects connection limit 0', () => {
    const match = checkAlterDatabaseConnection('alter database postgres connection limit 0;')
    expect(match).toBe(true)
  })

  it('detects allow_connections false', () => {
    const match = checkAlterDatabaseConnection('alter database postgres allow_connections false;')
    expect(match).toBe(true)
  })

  it('detects case-insensitive match', () => {
    const match = checkAlterDatabaseConnection('ALTER DATABASE postgres CONNECTION LIMIT 0;')
    expect(match).toBe(true)
  })

  it('detects statement among multiple statements', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      select * from countries;
      alter database postgres connection limit 0;
    `)
    expect(match).toBe(true)
  })

  it('does not flag unrelated alter database statement', () => {
    const match = checkAlterDatabaseConnection(
      'alter database postgres set statement_timeout = 60000;'
    )
    expect(match).toBe(false)
  })

  it('does not flag non-alter statements', () => {
    const match = checkAlterDatabaseConnection('select * from countries;')
    expect(match).toBe(false)
  })

  it('ignores statements inside comments', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      -- alter database postgres connection limit 0;
      select 1;
    `)
    expect(match).toBe(false)
  })

  it('detects both dangerous statements in same query', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      alter database postgres connection limit 0;
      alter database postgres allow_connections false;
    `)
    expect(match).toBe(true)
  })
})
