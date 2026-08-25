import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

test('grant and revoke table privileges for special role identifiers', async () => {
  const db = await createTestDatabase()
  try {
    await db.executeQuery(`
      DROP ROLE IF EXISTS "grant'er", "x$$y", "Public", table_privilege_other;
      CREATE ROLE "grant'er";
      CREATE ROLE "x$$y";
      CREATE ROLE "Public";
      CREATE ROLE table_privilege_other;
      CREATE TABLE public.privilege_quote_probe (id integer);
    `)

    const retrieved = pgMeta.tables.retrieve({
      name: 'privilege_quote_probe',
      schema: 'public',
    })
    const table = retrieved.zod.parse((await db.executeQuery(retrieved.sql))[0])

    const { sql: grantSql } = pgMeta.tablePrivileges.grant([
      {
        relationId: table!.id,
        grantee: "grant'er",
        privilegeType: 'SELECT',
        isGrantable: true,
      },
      { relationId: table!.id, grantee: 'x$$y', privilegeType: 'SELECT' },
      { relationId: table!.id, grantee: 'Public', privilegeType: 'SELECT' },
    ])
    await db.executeQuery(grantSql)

    const granted = await db.executeQuery<{ role_name: string; granted: boolean }[]>(
      `
        SELECT role_name, has_table_privilege(role_name, 'public.privilege_quote_probe', 'SELECT') AS granted
        FROM unnest(ARRAY['grant''er', 'x$$y', 'Public', 'table_privilege_other']) AS role_name;
      `
    )
    expect(granted).toEqual([
      { role_name: "grant'er", granted: true },
      { role_name: 'x$$y', granted: true },
      { role_name: 'Public', granted: true },
      { role_name: 'table_privilege_other', granted: false },
    ])

    const grantOptions = await db.executeQuery<{ is_grantable: boolean }[]>(`
      SELECT acl.is_grantable
      FROM pg_class AS c
      CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
      JOIN pg_roles AS r ON r.oid = acl.grantee
      WHERE c.oid = 'public.privilege_quote_probe'::regclass
        AND r.rolname = 'grant''er'
        AND acl.privilege_type = 'SELECT';
    `)
    expect(grantOptions).toEqual([{ is_grantable: true }])

    const { sql: revokeSql } = pgMeta.tablePrivileges.revoke([
      { relationId: table!.id, grantee: "grant'er", privilegeType: 'SELECT' },
      { relationId: table!.id, grantee: 'x$$y', privilegeType: 'SELECT' },
      { relationId: table!.id, grantee: 'Public', privilegeType: 'SELECT' },
    ])
    await db.executeQuery(revokeSql)

    const revoked = await db.executeQuery<{ role_name: string; granted: boolean }[]>(
      `
        SELECT role_name, has_table_privilege(role_name, 'public.privilege_quote_probe', 'SELECT') AS granted
        FROM unnest(ARRAY['grant''er', 'x$$y', 'Public', 'table_privilege_other']) AS role_name;
      `
    )
    expect(revoked).toEqual([
      { role_name: "grant'er", granted: false },
      { role_name: 'x$$y', granted: false },
      { role_name: 'Public', granted: false },
      { role_name: 'table_privilege_other', granted: false },
    ])
  } finally {
    await db
      .executeQuery(`DROP ROLE IF EXISTS "grant'er", "x$$y", "Public", table_privilege_other;`)
      .catch(() => undefined)
    await db.cleanup()
  }
})
