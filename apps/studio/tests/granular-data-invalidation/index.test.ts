import { describe, it, expect } from 'vitest'

import { invalidateDataGranularly } from 'lib/granular-data-invalidation'
import { tableKeys } from 'data/tables/keys'
import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'

describe('invalidateDataGranularly', () => {
  const projectRef = 'proj_123'

  it('returns [] when sql or projectRef is empty', async () => {
    expect(await invalidateDataGranularly('', projectRef)).toEqual([])
    expect(await invalidateDataGranularly('create table public.t(id int);', '')).toEqual([])
  })

  it('returns [] for unsupported SQL (no valid action substring)', async () => {
    const sql = 'SELECT 1;'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([])
  })

  it('returns [] for ALTER statement (unsupported action)', async () => {
    const sql = 'ALTER TABLE public.users ADD COLUMN name text;'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([])
  })

  it('plans invalidations for CREATE TABLE with explicit schema', async () => {
    const sql = 'CREATE TABLE public.users (id int);'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: tableKeys.list(projectRef, 'public', true), exact: true },
      { key: tableKeys.list(projectRef, 'public', false), exact: true },
      { key: tableKeys.retrieve(projectRef, 'users', 'public'), refetchType: 'active' },
      { key: entityTypeKeys.list(projectRef), exact: false },
    ])
  })

  it('plans invalidations for CREATE TABLE without schema (defaults to public)', async () => {
    const sql = 'CREATE TABLE users (id int);'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: tableKeys.list(projectRef, 'public', true), exact: true },
      { key: tableKeys.list(projectRef, 'public', false), exact: true },
      { key: tableKeys.retrieve(projectRef, 'users', 'public'), refetchType: 'active' },
      { key: entityTypeKeys.list(projectRef), exact: false },
    ])
  })

  it('plans invalidations for DROP TABLE with schema-qualified name', async () => {
    const sql = 'DROP TABLE public.sessions;'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: tableKeys.list(projectRef, 'public', true), exact: true },
      { key: tableKeys.list(projectRef, 'public', false), exact: true },
      { key: tableKeys.retrieve(projectRef, 'sessions', 'public'), refetchType: 'active' },
      { key: entityTypeKeys.list(projectRef), exact: false },
    ])
  })

  it('plans invalidations for DROP TABLE without schema (defaults to public)', async () => {
    const sql = 'DROP TABLE sessions;'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: tableKeys.list(projectRef, 'public', true), exact: true },
      { key: tableKeys.list(projectRef, 'public', false), exact: true },
      { key: tableKeys.retrieve(projectRef, 'sessions', 'public'), refetchType: 'active' },
      { key: entityTypeKeys.list(projectRef), exact: false },
    ])
  })

  it('plans invalidations for CREATE FUNCTION without schema (defaults to public)', async () => {
    const sql = 'CREATE FUNCTION do_something() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: databaseKeys.databaseFunctions(projectRef), refetchType: 'active' },
    ])
  })

  it('plans invalidations for CREATE FUNCTION with schema-qualified name', async () => {
    const sql =
      'CREATE FUNCTION util.do_something() RETURNS void AS $$ BEGIN END $$ LANGUAGE plpgsql;'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: databaseKeys.databaseFunctions(projectRef), refetchType: 'active' },
    ])
  })

  it('plans invalidations for DROP FUNCTION with schema-qualified name', async () => {
    const sql = 'DROP FUNCTION util.do_something();'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: databaseKeys.databaseFunctions(projectRef), refetchType: 'active' },
    ])
  })

  it('plans invalidations for cron.schedule via SELECT statement', async () => {
    const sql = "select cron.schedule('job', '* * * * *', $$ select 1 $$);"
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: ['projects', projectRef, 'cron-jobs'], exact: false, refetchType: 'active' },
    ])
  })

  it('plans invalidations for cron.unschedule via SELECT statement', async () => {
    const sql = "select cron.unschedule('job');"
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: ['projects', projectRef, 'cron-jobs'], exact: false, refetchType: 'active' },
    ])
  })

  it('aggregates actions across multiple statements', async () => {
    const sql = 'CREATE TABLE public.a(id int); DROP FUNCTION util.f();'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([
      { key: tableKeys.list(projectRef, 'public', true), exact: true },
      { key: tableKeys.list(projectRef, 'public', false), exact: true },
      { key: tableKeys.retrieve(projectRef, 'a', 'public'), refetchType: 'active' },
      { key: entityTypeKeys.list(projectRef), exact: false },
      { key: databaseKeys.databaseFunctions(projectRef), refetchType: 'active' },
    ])
  })

  it('returns [] on parser failure', async () => {
    const sql = 'CREATE TABLE'
    const result = await invalidateDataGranularly(sql, projectRef)
    expect(result).toEqual([])
  })
})
