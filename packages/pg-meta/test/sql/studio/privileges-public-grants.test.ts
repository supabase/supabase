import { afterAll, describe, expect, test } from 'vitest'

import { getExposedFunctionsSql, getExposedTablesSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

type Db = Awaited<ReturnType<typeof createTestDatabase>>

afterAll(async () => {
  await cleanupRoot()
})

/**
 * The queries under test name `anon`, `authenticated` and `service_role` directly, so the roles
 * have to exist. They are cluster-wide, and every test database on this cluster wants the same
 * three, so create them idempotently and leave them alone afterwards.
 */
const ensureDataApiRoles = (db: Db) =>
  db.executeQuery(`
    do $$ begin
      create role anon nologin;
    exception when duplicate_object then null; end $$;
    do $$ begin
      create role authenticated nologin;
    exception when duplicate_object then null; end $$;
    do $$ begin
      create role service_role nologin;
    exception when duplicate_object then null; end $$;
  `)

const statusOfFunction = async (db: Db, name: string) => {
  const [row] = await db.executeQuery<
    { functions: { schema: string; name: string; status: string }[] }[]
  >(getExposedFunctionsSql({ search: name, offset: 0, limit: 50 }))
  return row.functions.find((f) => f.name === name)?.status
}

const statusOfTable = async (db: Db, name: string) => {
  const [row] = await db.executeQuery<
    { tables: { schema: string; name: string; status: string }[] }[]
  >(getExposedTablesSql({ search: name, offset: 0, limit: 50 }))
  return row.tables.find((t) => t.name === name)?.status
}

/** What Postgres itself says the Data API role can do -- the ground truth Studio should agree with. */
const canExecute = async (db: Db, role: string, fn: string) => {
  const [row] = await db.executeQuery<{ allowed: boolean }[]>(
    `select has_function_privilege('${role}', 'public.${fn}()', 'EXECUTE') as allowed;`
  )
  return row.allowed
}

const canSelect = async (db: Db, role: string, table: string) => {
  const [row] = await db.executeQuery<{ allowed: boolean }[]>(
    `select has_table_privilege('${role}', 'public.${table}', 'SELECT') as allowed;`
  )
  return row.allowed
}

const withTestDatabase = (name: string, fn: (db: Db) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await ensureDataApiRoles(db)
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

describe('access held through PUBLIC', () => {
  withTestDatabase('a function with no explicit ACL is not reported as revoked', async (db) => {
    // No grant statement at all: proacl stays null, so Postgres falls back to acldefault(), which
    // includes an EXECUTE entry for PUBLIC -- and PUBLIC covers anon.
    await db.executeQuery(
      `create function public.pub_exec_fn() returns int language sql as $fn$ select 1 $fn$;`
    )

    expect(await canExecute(db, 'anon', 'pub_exec_fn')).toBe(true)
    expect(await statusOfFunction(db, 'pub_exec_fn')).not.toBe('revoked')
  })

  withTestDatabase('a function executable through PUBLIC is reported as granted', async (db) => {
    await db.executeQuery(
      `create function public.pub_granted_fn() returns int language sql as $fn$ select 1 $fn$;`
    )

    for (const role of ['anon', 'authenticated', 'service_role']) {
      expect(await canExecute(db, role, 'pub_granted_fn')).toBe(true)
    }
    expect(await statusOfFunction(db, 'pub_granted_fn')).toBe('granted')
  })

  withTestDatabase('an explicit PUBLIC grant on a table is attributed', async (db) => {
    // Tables escape this by default -- acldefault('r', ...) is owner-only -- so it takes an
    // explicit grant to PUBLIC to reach the same blind spot.
    await db.executeQuery(`
      create table public.pub_grant_tbl (id int);
      grant select on public.pub_grant_tbl to public;
    `)

    expect(await canSelect(db, 'anon', 'pub_grant_tbl')).toBe(true)
    // SELECT only, so this is partial access rather than full access.
    expect(await statusOfTable(db, 'pub_grant_tbl')).toBe('custom')
  })

  withTestDatabase('a table fully granted to PUBLIC is reported as granted', async (db) => {
    await db.executeQuery(`
      create table public.pub_all_tbl (id int);
      grant select, insert, update, delete on public.pub_all_tbl to public;
    `)

    expect(await statusOfTable(db, 'pub_all_tbl')).toBe('granted')
  })
})

describe('revoking PUBLIC is still reported as revoked', () => {
  withTestDatabase('function with EXECUTE revoked from PUBLIC and the roles', async (db) => {
    await db.executeQuery(`
      create function public.revoked_fn() returns int language sql as $fn$ select 1 $fn$;
      revoke execute on function public.revoked_fn() from public, anon, authenticated, service_role;
    `)

    for (const role of ['anon', 'authenticated', 'service_role']) {
      expect(await canExecute(db, role, 'revoked_fn')).toBe(false)
    }
    expect(await statusOfFunction(db, 'revoked_fn')).toBe('revoked')
  })

  withTestDatabase('table with no grants at all', async (db) => {
    await db.executeQuery(`create table public.no_grant_tbl (id int);`)

    expect(await canSelect(db, 'anon', 'no_grant_tbl')).toBe(false)
    expect(await statusOfTable(db, 'no_grant_tbl')).toBe('revoked')
  })
})

describe('direct grants keep working', () => {
  withTestDatabase('function granted to anon only is custom', async (db) => {
    await db.executeQuery(`
      create function public.anon_only_fn() returns int language sql as $fn$ select 1 $fn$;
      revoke execute on function public.anon_only_fn() from public;
      grant execute on function public.anon_only_fn() to anon;
    `)

    expect(await canExecute(db, 'anon', 'anon_only_fn')).toBe(true)
    expect(await canExecute(db, 'authenticated', 'anon_only_fn')).toBe(false)
    expect(await statusOfFunction(db, 'anon_only_fn')).toBe('custom')
  })

  withTestDatabase('table granted to all three roles directly is granted', async (db) => {
    await db.executeQuery(`
      create table public.direct_tbl (id int);
      grant select, insert, update, delete on public.direct_tbl
        to anon, authenticated, service_role;
    `)

    expect(await statusOfTable(db, 'direct_tbl')).toBe('granted')
  })
})
