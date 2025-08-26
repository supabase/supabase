import { describe, it, expect } from 'vitest'

import { parseSqlStatements } from 'lib/granular-data-invalidation/parse-sql-statements'

describe('parseSqlStatements', () => {
  const projectRef = 'proj_123'

  it('returns [] when sql or projectRef is empty', async () => {
    await expect(parseSqlStatements('', projectRef)).resolves.toEqual([])
    await expect(parseSqlStatements('create table public.t (id int);', '')).resolves.toEqual([])
  })

  it('returns [] for unsupported SQL (no valid action substring)', async () => {
    const sql = 'SELECT 1;'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([])
  })

  it('returns [] for ALTER statement (unsupported action)', async () => {
    const sql = 'ALTER TABLE public.users ADD COLUMN name text;'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([])
  })

  it('parses CREATE TABLE with explicit schema', async () => {
    const sql = 'CREATE TABLE public.users (id int);'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'table',
        schema: 'public',
        table: 'users',
        entityName: 'users',
        projectRef,
      },
    ])
  })

  it('parses CREATE TABLE without schema (defaults to public)', async () => {
    const sql = 'CREATE TABLE users (id int);'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'table',
        schema: 'public',
        table: 'users',
        entityName: 'users',
        projectRef,
      },
    ])
  })

  it('parses DROP TABLE with schema', async () => {
    const sql = 'DROP TABLE public.sessions;'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'table',
        schema: 'public',
        table: 'sessions',
        entityName: 'sessions',
        projectRef,
      },
    ])
  })

  it('parses CREATE FUNCTION without schema (defaults to public)', async () => {
    const sql = 'CREATE FUNCTION do_something() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'function',
        schema: 'public',
        entityName: 'do_something',
        projectRef,
      },
    ])
  })

  it('parses CREATE FUNCTION with schema-qualified name', async () => {
    const sql =
      'CREATE FUNCTION util.do_something() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'function',
        schema: 'util',
        entityName: 'do_something',
        projectRef,
      },
    ])
  })

  it('parses DROP FUNCTION with schema-qualified name', async () => {
    const sql = 'DROP FUNCTION util.do_something();'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'function',
        schema: 'util',
        entityName: 'do_something',
        projectRef,
      },
    ])
  })

  it('detects cron.schedule via SELECT statement', async () => {
    const sql = "select cron.schedule('job', '* * * * *', $$ select 1 $$);"
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'cron',
        entityName: 'schedule',
        projectRef,
      },
    ])
  })

  it('detects cron.unschedule via SELECT statement', async () => {
    const sql = "select cron.unschedule('job');"
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'cron',
        entityName: 'unschedule',
        projectRef,
      },
    ])
  })

  it('handles multiple statements and aggregates events', async () => {
    const sql = 'CREATE TABLE public.a(id int); DROP FUNCTION util.f();'
    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([
      {
        entityType: 'table',
        schema: 'public',
        table: 'a',
        entityName: 'a',
        projectRef,
      },
      {
        entityType: 'function',
        schema: 'util',
        entityName: 'f',
        projectRef,
      },
    ])
  })

  it('returns [] on parser failure and logs error', async () => {
    const sql = 'CREATE TABLE'

    const result = await parseSqlStatements(sql, projectRef)
    expect(result).toEqual([])
  })
})
