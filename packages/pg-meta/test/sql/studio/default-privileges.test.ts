import { afterAll, expect, test } from 'vitest'

import { buildDefaultPrivilegesSql, getDefaultPrivilegesStateSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

type Db = Awaited<ReturnType<typeof createTestDatabase>>

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (name: string, fn: (db: Db) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      // Roles are cluster-wide, so only create the Data API roles once.
      await db.executeQuery(`
        do $$
        declare r text;
        begin
          foreach r in array array['anon', 'authenticated', 'service_role'] loop
            if not exists (select 1 from pg_roles where rolname = r) then
              execute format('create role %I nologin', r);
            end if;
          end loop;
        end $$;
      `)
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const grantCount = async (db: Db) => {
  const [row] = await db.executeQuery<{ grant_count: number }[]>(getDefaultPrivilegesStateSql())
  return row.grant_count
}

withTestDatabase('counts default privileges granted to the Data API roles', async (db) => {
  await db.executeQuery(buildDefaultPrivilegesSql('grant'))
  expect(await grantCount(db)).toBe(3)
})

withTestDatabase('does not count default privileges after they are revoked', async (db) => {
  await db.executeQuery(buildDefaultPrivilegesSql('grant'))
  await db.executeQuery(buildDefaultPrivilegesSql('revoke'))
  expect(await grantCount(db)).toBe(0)
})

withTestDatabase('counts default privileges granted to PUBLIC', async (db) => {
  await db.executeQuery(buildDefaultPrivilegesSql('revoke'))
  await db.executeQuery(`
    alter default privileges for role postgres in schema public grant select on tables to public;
    alter default privileges for role postgres in schema public grant execute on functions to public;
    alter default privileges for role postgres in schema public grant usage on sequences to public;
  `)
  expect(await grantCount(db)).toBe(3)
})
