import { TABLE_EVENT_ACTIONS } from 'common/telemetry-constants'
import { describe, expect, it } from 'vitest'
import { sqlEventParser } from './sql-event-parser'

describe('SQL Event Parser', () => {
  describe('CREATE TABLE detection', () => {
    it('detects basic CREATE TABLE', () => {
      const results = sqlEventParser.getTableEvents('CREATE TABLE users (id INT PRIMARY KEY)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('detects CREATE TABLE with schema', () => {
      const results = sqlEventParser.getTableEvents('CREATE TABLE public.users (id INT)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: 'public',
        tableName: 'users',
      })
    })

    it('detects CREATE TABLE IF NOT EXISTS', () => {
      const results = sqlEventParser.getTableEvents('CREATE TABLE IF NOT EXISTS users (id INT)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('handles quoted identifiers', () => {
      const results = sqlEventParser.getTableEvents('CREATE TABLE "public"."user_table" (id INT)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: 'public',
        tableName: 'user_table',
      })
    })

    it('returns empty array for non-matching SQL', () => {
      const results = sqlEventParser.getTableEvents('SELECT * FROM users')
      expect(results).toHaveLength(0)
    })

    it('detects CREATE TEMPORARY TABLE', () => {
      const results = sqlEventParser.getTableEvents('CREATE TEMPORARY TABLE temp_users (id INT)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'temp_users',
      })
    })

    it('detects CREATE TEMP TABLE', () => {
      const results = sqlEventParser.getTableEvents('CREATE TEMP TABLE temp_users (id INT)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'temp_users',
      })
    })

    it('detects CREATE UNLOGGED TABLE', () => {
      const results = sqlEventParser.getTableEvents('CREATE UNLOGGED TABLE fast_table (id INT)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'fast_table',
      })
    })

    it('detects CREATE TEMP TABLE IF NOT EXISTS', () => {
      const results = sqlEventParser.getTableEvents(
        'CREATE TEMP TABLE IF NOT EXISTS temp_users (id INT)'
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'temp_users',
      })
    })
  })

  describe('INSERT detection', () => {
    it('detects basic INSERT INTO', () => {
      const results = sqlEventParser.getTableEvents("INSERT INTO users (name) VALUES ('John')")
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('detects INSERT with schema', () => {
      const results = sqlEventParser.getTableEvents(
        "INSERT INTO public.users (name) VALUES ('John')"
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        schema: 'public',
        tableName: 'users',
      })
    })

    it('handles quoted identifiers', () => {
      const results = sqlEventParser.getTableEvents('INSERT INTO "auth"."users" (id) VALUES (1)')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        schema: 'auth',
        tableName: 'users',
      })
    })

    it('returns empty array for non-matching SQL', () => {
      const results = sqlEventParser.getTableEvents('UPDATE users SET name = "John"')
      expect(results).toHaveLength(0)
    })
  })

  describe('COPY detection', () => {
    it('detects basic COPY FROM', () => {
      const results = sqlEventParser.getTableEvents("COPY users FROM '/tmp/users.csv'")
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('detects COPY with schema', () => {
      const results = sqlEventParser.getTableEvents(
        "COPY public.users FROM '/tmp/users.csv' WITH CSV HEADER"
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        schema: 'public',
        tableName: 'users',
      })
    })

    it('handles quoted identifiers', () => {
      const results = sqlEventParser.getTableEvents('COPY "auth"."users" FROM STDIN')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableDataAdded,
        schema: 'auth',
        tableName: 'users',
      })
    })

    it('returns empty array for COPY TO', () => {
      const results = sqlEventParser.getTableEvents("COPY users TO '/tmp/users.csv'")
      expect(results).toHaveLength(0)
    })

    it('returns empty array for non-matching SQL', () => {
      const results = sqlEventParser.getTableEvents('SELECT * FROM users')
      expect(results).toHaveLength(0)
    })
  })

  describe('SELECT INTO detection', () => {
    it('detects SELECT INTO', () => {
      const results = sqlEventParser.getTableEvents('SELECT * INTO new_users FROM users')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'new_users',
      })
    })

    it('detects SELECT INTO with schema', () => {
      const results = sqlEventParser.getTableEvents(
        'SELECT id, name INTO public.new_users FROM users'
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: 'public',
        tableName: 'new_users',
      })
    })

    it('detects CREATE TABLE AS SELECT', () => {
      const results = sqlEventParser.getTableEvents('CREATE TABLE new_users AS SELECT * FROM users')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'new_users',
      })
    })

    it('detects CREATE TABLE IF NOT EXISTS AS SELECT', () => {
      const results = sqlEventParser.getTableEvents(
        'CREATE TABLE IF NOT EXISTS new_users AS SELECT * FROM users WHERE active = true'
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'new_users',
      })
    })

    it('handles quoted identifiers', () => {
      const results = sqlEventParser.getTableEvents(
        'SELECT * INTO "backup"."users_2024" FROM users'
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: 'backup',
        tableName: 'users_2024',
      })
    })

    it('returns empty array for regular SELECT', () => {
      const results = sqlEventParser.getTableEvents('SELECT * FROM users')
      expect(results).toHaveLength(0)
    })
  })

  describe('RLS detection', () => {
    it('detects ALTER TABLE ENABLE ROW LEVEL SECURITY', () => {
      const results = sqlEventParser.getTableEvents('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableRLSEnabled,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('detects short form ENABLE RLS', () => {
      const results = sqlEventParser.getTableEvents('ALTER TABLE users ENABLE RLS')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableRLSEnabled,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('detects with schema', () => {
      const results = sqlEventParser.getTableEvents(
        'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY'
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableRLSEnabled,
        schema: 'public',
        tableName: 'users',
      })
    })

    it('handles other ALTER TABLE statements in between', () => {
      const results = sqlEventParser.getTableEvents(
        'ALTER TABLE users ADD COLUMN test INT, ENABLE ROW LEVEL SECURITY'
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableRLSEnabled,
        schema: undefined,
        tableName: 'users',
      })
    })

    it('returns empty array for disabling RLS', () => {
      const results = sqlEventParser.getTableEvents('ALTER TABLE users DISABLE ROW LEVEL SECURITY')
      expect(results).toHaveLength(0)
    })
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

    it('handles identifiers with numbers', () => {
      const sql = 'CREATE TABLE table123 (id INT)'
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'table123',
      })
    })

    it('handles identifiers with underscores', () => {
      const sql = 'CREATE TABLE user_accounts (id INT)'
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: TABLE_EVENT_ACTIONS.TableCreated,
        schema: undefined,
        tableName: 'user_accounts',
      })
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

    it('handles dollar-quoted strings in SQL', () => {
      const sql = `
        CREATE TABLE users (id INT);
        INSERT INTO logs VALUES ($$CREATE TABLE fake$$);
        INSERT INTO users VALUES (1);
      `
      const results = sqlEventParser.getTableEvents(sql)
      expect(results).toHaveLength(3)
      expect(results[0].type).toBe(TABLE_EVENT_ACTIONS.TableCreated)
      expect(results[0]).toMatchObject({ tableName: 'users' })
      expect(results[1].type).toBe(TABLE_EVENT_ACTIONS.TableCreated)
      expect(results[1]).toMatchObject({ tableName: 'fake' })
      expect(results[2].type).toBe(TABLE_EVENT_ACTIONS.TableDataAdded)
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
