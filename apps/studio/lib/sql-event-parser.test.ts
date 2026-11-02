import { TABLE_EVENT_ACTIONS } from 'common/telemetry-constants'
import { describe, expect, it } from 'vitest'

import { sqlEventParser } from './sql-event-parser'

describe('SQL Event Parser', () => {
  const { TableCreated, TableDataAdded, TableRLSEnabled } = TABLE_EVENT_ACTIONS

  it.each([
    // CREATE TABLE
    ['CREATE TABLE users (id INT PRIMARY KEY)', TableCreated, undefined, 'users'],
    ['CREATE TABLE public.users (id INT)', TableCreated, 'public', 'users'],
    ['CREATE TABLE IF NOT EXISTS users (id INT)', TableCreated, undefined, 'users'],
    ['CREATE TABLE "public"."user_table" (id INT)', TableCreated, 'public', 'user_table'],
    ['CREATE TEMPORARY TABLE temp_users (id INT)', TableCreated, undefined, 'temp_users'],
    ['CREATE TEMP TABLE temp_users (id INT)', TableCreated, undefined, 'temp_users'],
    ['CREATE UNLOGGED TABLE fast_table (id INT)', TableCreated, undefined, 'fast_table'],
    ['CREATE TEMP TABLE IF NOT EXISTS temp_users (id INT)', TableCreated, undefined, 'temp_users'],
    ['CREATE TABLE table123 (id INT)', TableCreated, undefined, 'table123'],
    // INSERT
    ["INSERT INTO users (name) VALUES ('John')", TableDataAdded, undefined, 'users'],
    ["INSERT INTO public.users (name) VALUES ('John')", TableDataAdded, 'public', 'users'],
    ['INSERT INTO "auth"."users" (id) VALUES (1)', TableDataAdded, 'auth', 'users'],
    // COPY ... FROM
    ["COPY users FROM '/tmp/users.csv'", TableDataAdded, undefined, 'users'],
    ["COPY public.users FROM '/tmp/users.csv' WITH CSV HEADER", TableDataAdded, 'public', 'users'],
    ['COPY "auth"."users" FROM STDIN', TableDataAdded, 'auth', 'users'],
    // SELECT INTO / CREATE TABLE AS
    ['SELECT * INTO new_users FROM users', TableCreated, undefined, 'new_users'],
    ['SELECT id, name INTO public.new_users FROM users', TableCreated, 'public', 'new_users'],
    ['SELECT * INTO "backup"."users_2024" FROM users', TableCreated, 'backup', 'users_2024'],
    ['CREATE TABLE new_users AS SELECT * FROM users', TableCreated, undefined, 'new_users'],
    [
      'CREATE TABLE IF NOT EXISTS new_users AS SELECT * FROM users WHERE active = true',
      TableCreated,
      undefined,
      'new_users',
    ],
    // RLS
    ['ALTER TABLE users ENABLE ROW LEVEL SECURITY', TableRLSEnabled, undefined, 'users'],
    ['ALTER TABLE users ENABLE RLS', TableRLSEnabled, undefined, 'users'],
    ['ALTER TABLE public.users ENABLE ROW LEVEL SECURITY', TableRLSEnabled, 'public', 'users'],
    [
      'ALTER TABLE users ADD COLUMN test INT, ENABLE ROW LEVEL SECURITY',
      TableRLSEnabled,
      undefined,
      'users',
    ],
    [
      'ALTER TABLE IF EXISTS public."Conversations" ENABLE ROW LEVEL SECURITY',
      TableRLSEnabled,
      'public',
      'Conversations',
    ],
    ['ALTER TABLE ONLY public.users ENABLE ROW LEVEL SECURITY', TableRLSEnabled, 'public', 'users'],
    [
      'ALTER TABLE IF EXISTS ONLY public.users ENABLE ROW LEVEL SECURITY',
      TableRLSEnabled,
      'public',
      'users',
    ],
  ])('detects %s', (sql, type, schema, tableName) => {
    expect(sqlEventParser.getTableEvents(sql)).toEqual([{ type, schema, tableName }])
  })

  it.each([
    'SELECT * FROM users',
    'UPDATE users SET name = "John"',
    "COPY users TO '/tmp/users.csv'",
    'ALTER TABLE users DISABLE ROW LEVEL SECURITY',
  ])('returns no events for %s', (sql) => {
    expect(sqlEventParser.getTableEvents(sql)).toEqual([])
  })

  describe('ReDoS protection', () => {
    it('handles extremely long identifier names efficiently', () => {
      const longIdentifier = 'a'.repeat(10000)
      const sql = `CREATE TABLE ${longIdentifier} (id INT)`

      const startTime = Date.now()
      const results = sqlEventParser.getTableEvents(sql)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: longIdentifier,
      })
    })

    it('handles nested dots in schema names without catastrophic backtracking', () => {
      const maliciousInput = 'a.'.repeat(1000) + 'table'
      const sql = `CREATE TABLE ${maliciousInput} (id INT)`

      const startTime = Date.now()
      const results = sqlEventParser.getTableEvents(sql)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100)
      expect(results.length).toBeGreaterThan(0)
    })

    it('handles pathological SELECT INTO patterns', () => {
      const maliciousSQL = 'SELECT ' + 'a '.repeat(1000) + 'INTO table FROM users'

      const startTime = Date.now()
      const results = sqlEventParser.getTableEvents(maliciousSQL)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'table',
      })
    })

    it('handles ALTER TABLE with many operations between', () => {
      const manyOperations = 'ADD COLUMN test INT, '.repeat(100)
      const sql = `ALTER TABLE users ${manyOperations} ENABLE ROW LEVEL SECURITY`

      const startTime = Date.now()
      const results = sqlEventParser.getTableEvents(sql)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableRLSEnabled,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('handles mixed quotes and backticks efficiently', () => {
      const mixedQuotes = '`"`.'.repeat(100) + 'tablename'
      const sql = `CREATE TABLE ${mixedQuotes} (id INT)`

      const startTime = Date.now()
      sqlEventParser.getTableEvents(sql)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100)
    })
  })

  describe('Edge cases and special characters', () => {
    it('handles Unicode identifiers', () => {
      const sql = 'CREATE TABLE 用户表 (id INT)'
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(0)
    })

    it('handles escaped quotes in identifiers', () => {
      const sql = 'CREATE TABLE "user""table" (id INT)'
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'usertable',
      })
    })

    it('does not scan inside dollar-quoted string literals', () => {
      // $$...$$ is a string literal in Postgres — its contents must not be
      // parsed as DDL, otherwise a user inserting SQL-shaped text into a log
      // table would trigger false-positive table-created events.
      const sql = `
        CREATE TABLE users (id INT);
        INSERT INTO logs VALUES ($$CREATE TABLE fake$$);
        INSERT INTO users VALUES (1);
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(3)
      expect(results[0]).toMatchObject({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        tableName: 'users',
      })
      expect(results[1]).toMatchObject({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        tableName: 'logs',
      })
      expect(results[2]).toMatchObject({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        tableName: 'users',
      })
    })

    it('does not treat SELECT..INTO inside a plpgsql body as table creation', () => {
      // Regression for the RLS warning modal false-positive: variable
      // assignment inside a function body must not be reported as a new table.
      const sql = `
        create or replace function schema_checks()
        returns jsonb
        language plpgsql
        as $$
        declare
          ret jsonb;
        begin
          select jsonb_build_object('value', 'ok') into ret;
          return ret;
        end;
        $$;
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toEqual([])
    })

    it('does not leak nested dollar-quoted dynamic SQL through statement splitting', () => {
      // Regression: an inner $sql$...$sql$ tag used inside an outer $fn$...$fn$
      // body was pairing with the outer opening tag (the splitStatements regex
      // doesn't enforce matching tags), which caused the inner semicolon to
      // split the statement and exposed `create table fake` to the detectors.
      // The fix is that stripDollarQuoteBodies runs before splitStatements and
      // uses a backreference to require matching tags.
      const sql = `
        create function f()
        returns void
        language plpgsql
        as $fn$
        begin
          execute $sql$create table fake(id int);$sql$;
        end;
        $fn$;
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toEqual([])
    })

    it('still detects a real top-level CREATE TABLE next to a function with nested dollar tags', () => {
      const sql = `
        create table public.real_table(id int);
        create function f()
        returns void
        language plpgsql
        as $fn$
        begin
          execute $sql$create table fake(id int);$sql$;
        end;
        $fn$;
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toEqual([
        {
          type: TABLE_EVENT_ACTIONS.TableCreated,
          schema: 'public',
          tableName: 'real_table',
        },
      ])
    })

    it('handles SQL injection attempts safely', () => {
      const sql = "CREATE TABLE users'; DROP TABLE users; -- (id INT)"
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'users',
      })
    })
  })

  describe('getTableEvents', () => {
    it('filters only table-related events', () => {
      const sql = `
        CREATE TABLE users (id INT);
        CREATE FUNCTION test() RETURNS INT AS $$ BEGIN RETURN 1; END; $$ LANGUAGE plpgsql;
        INSERT INTO users (id) VALUES (1);
        ALTER TABLE users ENABLE RLS;
        CREATE VIEW user_view AS SELECT * FROM users;
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(3)
      expect(results.map((r) => r.type)).toEqual([
        TABLE_EVENT_ACTIONS.TableCreated,
        TABLE_EVENT_ACTIONS.TableDataAdded,
        TABLE_EVENT_ACTIONS.TableRLSEnabled,
      ])
    })

    it('returns empty array for non-table SQL', () => {
      const sql = `
        CREATE FUNCTION test() RETURNS INT AS $$ BEGIN RETURN 1; END; $$ LANGUAGE plpgsql;
        CREATE VIEW user_view AS SELECT * FROM users;
        SELECT * FROM users;
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(0)
    })
  })
})
