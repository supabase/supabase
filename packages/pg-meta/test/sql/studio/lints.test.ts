import { afterAll, describe, expect, it, test } from 'vitest'

import { enrichLintsQuery, getLintsSQL, safeSql } from '../../../src'
import { cleanupRoot, createDatabaseWithAuthSchema, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

type LintRow = { name: string; metadata: { name: string } }

const reportedFunctionSearchPathMutable = (rows: LintRow[]) =>
  rows.filter((row) => row.name === 'function_search_path_mutable').map((row) => row.metadata.name)

describe('enrichLintsQuery', () => {
  const dummyQuery = safeSql`SELECT 1`

  it('should include SET LOCAL pgrst.db_schemas when exposedSchemas is provided', () => {
    const result = enrichLintsQuery(dummyQuery, 'public, storage')
    expect(result).toContain("set local pgrst.db_schemas = 'public, storage';")
  })

  it('should NOT include SET LOCAL pgrst.db_schemas when exposedSchemas is undefined', () => {
    const result = enrichLintsQuery(dummyQuery, undefined)
    expect(result).not.toContain('pgrst.db_schemas')
  })

  it('should NOT include SET LOCAL pgrst.db_schemas when exposedSchemas is empty string', () => {
    const result = enrichLintsQuery(dummyQuery, '')
    expect(result).not.toContain('pgrst.db_schemas')
  })

  it('should always include the query', () => {
    const result = enrichLintsQuery(dummyQuery)
    expect(result).toContain(dummyQuery)
  })
})

describe('function_search_path_mutable lint', () => {
  // The lint query reads auth.users and checks privileges for the anon and
  // authenticated roles, none of which exist in a fresh test database
  const prepareLintsDatabase = async (db: Awaited<ReturnType<typeof createTestDatabase>>) => {
    await createDatabaseWithAuthSchema(db)
    await db.executeQuery(`
      do $$ begin
        if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
        if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      end $$;
    `)
  }

  const runLints = (db: Awaited<ReturnType<typeof createTestDatabase>>) =>
    db.executeQuery<LintRow[]>(getLintsSQL({ docsUrl: 'https://supabase.com/docs' }))

  withTestDatabase('does not report aggregates', async (db) => {
    await prepareLintsDatabase(db)
    // CREATE AGGREGATE has no SET clause, so an aggregate can never pin its search_path
    await db.executeQuery(`
      create function public.int_add(a int, b int) returns int
        language sql set search_path = '' as $$ select a + b $$;
      create aggregate public.int_sum(int) (sfunc = public.int_add, stype = int, initcond = '0');
    `)

    expect(reportedFunctionSearchPathMutable(await runLints(db))).not.toContain('int_sum')
  })

  withTestDatabase(
    'still reports an aggregate support function without a search_path',
    async (db) => {
      await prepareLintsDatabase(db)
      await db.executeQuery(`
        create function public.int_add(a int, b int) returns int
          language sql as $$ select a + b $$;
        create aggregate public.int_sum(int) (sfunc = public.int_add, stype = int, initcond = '0');
      `)

      expect(reportedFunctionSearchPathMutable(await runLints(db))).toContain('int_add')
    }
  )
})
