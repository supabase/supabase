import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

test('grant and revoke column privileges from the PUBLIC pseudo-role', async () => {
  const db = await createTestDatabase()
  try {
    await db.executeQuery(`
      CREATE TABLE public.column_privilege_public_probe (id integer);
    `)

    const retrieved = pgMeta.tables.retrieve({
      name: 'column_privilege_public_probe',
      schema: 'public',
    })
    const table = retrieved.zod.parse((await db.executeQuery(retrieved.sql))[0])

    // Lowercase 'public' is the catalog value of the PUBLIC pseudo-role.
    const { sql: grantSql } = pgMeta.columnPrivileges.grant([
      { columnId: `${table!.id}.1`, grantee: 'public', privilegeType: 'SELECT' },
    ])
    await db.executeQuery(grantSql)

    const granted = await db.executeQuery<{ granted: boolean }[]>(
      `SELECT has_column_privilege('public', 'public.column_privilege_public_probe', 'id', 'SELECT') AS granted;`
    )
    expect(granted).toEqual([{ granted: true }])

    const { sql: revokeSql } = pgMeta.columnPrivileges.revoke([
      { columnId: `${table!.id}.1`, grantee: 'public', privilegeType: 'SELECT' },
    ])
    await db.executeQuery(revokeSql)

    const revoked = await db.executeQuery<{ granted: boolean }[]>(
      `SELECT has_column_privilege('public', 'public.column_privilege_public_probe', 'id', 'SELECT') AS granted;`
    )
    expect(revoked).toEqual([{ granted: false }])
  } finally {
    await db.cleanup()
  }
})

test('grant and revoke column privileges for special role identifiers', async () => {
  const db = await createTestDatabase()
  try {
    await db.executeQuery(`
      DROP ROLE IF EXISTS "grant'er", "x$$y", "Public", column_privilege_other,
        "x\$pg_meta\$y", "x\$pg_meta_1\$y";
      CREATE ROLE "grant'er";
      CREATE ROLE "x$$y";
      CREATE ROLE "Public";
      CREATE ROLE "x$pg_meta$y";
      CREATE ROLE "x$pg_meta_1$y";
      CREATE ROLE column_privilege_other;
      CREATE TABLE public.column_privilege_probe (id integer);
    `)

    const retrieved = pgMeta.tables.retrieve({
      name: 'column_privilege_probe',
      schema: 'public',
    })
    const table = retrieved.zod.parse((await db.executeQuery(retrieved.sql))[0])
    const columnId = `${table!.id}.1`

    const { sql: grantSql } = pgMeta.columnPrivileges.grant([
      {
        columnId,
        grantee: "grant'er",
        privilegeType: 'SELECT',
        isGrantable: true,
      },
      { columnId, grantee: 'x$$y', privilegeType: 'SELECT' },
      { columnId, grantee: 'Public', privilegeType: 'SELECT' },
      // Collide with the base dollar-quote delimiter and its first suffix so
      // the generated DO block has to re-pick a delimiter ($pg_meta_2$).
      { columnId, grantee: 'x$pg_meta$y', privilegeType: 'SELECT' },
      { columnId, grantee: 'x$pg_meta_1$y', privilegeType: 'SELECT' },
    ])
    await db.executeQuery(grantSql)

    const granted = await db.executeQuery<{ role_name: string; granted: boolean }[]>(
      `
        SELECT role_name,
               has_column_privilege(role_name, 'public.column_privilege_probe', 'id', 'SELECT') AS granted
        FROM unnest(ARRAY['grant''er', 'x$$y', 'Public', 'x$pg_meta$y', 'x$pg_meta_1$y', 'column_privilege_other']) AS role_name;
      `
    )
    expect(granted).toEqual([
      { role_name: "grant'er", granted: true },
      { role_name: 'x$$y', granted: true },
      { role_name: 'Public', granted: true },
      { role_name: 'x$pg_meta$y', granted: true },
      { role_name: 'x$pg_meta_1$y', granted: true },
      { role_name: 'column_privilege_other', granted: false },
    ])

    const grantOptions = await db.executeQuery<{ is_grantable: boolean }[]>(`
      SELECT acl.is_grantable
      FROM pg_attribute AS a
      CROSS JOIN LATERAL aclexplode(a.attacl) AS acl
      JOIN pg_roles AS r ON r.oid = acl.grantee
      WHERE a.attrelid = ${table!.id}
        AND a.attname = 'id'
        AND r.rolname = 'grant''er'
        AND acl.privilege_type = 'SELECT';
    `)
    expect(grantOptions).toEqual([{ is_grantable: true }])

    const { sql: revokeSql } = pgMeta.columnPrivileges.revoke([
      { columnId, grantee: "grant'er", privilegeType: 'SELECT' },
      { columnId, grantee: 'x$$y', privilegeType: 'SELECT' },
      { columnId, grantee: 'Public', privilegeType: 'SELECT' },
      { columnId, grantee: 'x$pg_meta$y', privilegeType: 'SELECT' },
      { columnId, grantee: 'x$pg_meta_1$y', privilegeType: 'SELECT' },
    ])
    await db.executeQuery(revokeSql)

    const revoked = await db.executeQuery<{ role_name: string; granted: boolean }[]>(
      `
        SELECT role_name,
               has_column_privilege(role_name, 'public.column_privilege_probe', 'id', 'SELECT') AS granted
        FROM unnest(ARRAY['grant''er', 'x$$y', 'Public', 'x$pg_meta$y', 'x$pg_meta_1$y', 'column_privilege_other']) AS role_name;
      `
    )
    expect(revoked).toEqual([
      { role_name: "grant'er", granted: false },
      { role_name: 'x$$y', granted: false },
      { role_name: 'Public', granted: false },
      { role_name: 'x$pg_meta$y', granted: false },
      { role_name: 'x$pg_meta_1$y', granted: false },
      { role_name: 'column_privilege_other', granted: false },
    ])
  } finally {
    await db
      .executeQuery(
        `DROP ROLE IF EXISTS "grant'er", "x$$y", "Public", column_privilege_other,
          "x$pg_meta$y", "x$pg_meta_1$y";`
      )
      .catch(() => undefined)
    await db.cleanup()
  }
})
