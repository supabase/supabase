import { afterAll, beforeAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

beforeAll(async () => {
  // Any global setup if needed
})

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

withTestDatabase('list table privileges', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tablePrivileges.list()
  const res = zod.parse(await executeQuery(sql))

  expect(
    res.find(({ schema, name }) => schema === 'public' && name === 'todos')
  ).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "todos",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "public",
    }
  `
  )
})

type Priv = { grantor: string; grantee: string; privilege_type: string; is_grantable: boolean }
type PrivRow = { relation_id: number; schema: string; name: string; privileges: Priv[] }

withTestDatabase(
  'scoped tablePrivileges.list/retrieve matches legacy (multiple grantees incl PUBLIC)',
  async ({ executeQuery }) => {
    // Multiple grantees including PUBLIC to exercise the PUBLIC (oid 0) branch of
    // the grantee union and multi-grantee aggregation. Roles are cluster-global
    // (not dropped by the per-test database cleanup), so guard the creation to
    // stay idempotent when the test cluster is reused across runs.
    await executeQuery(`
      drop role if exists grantee_a;
      drop role if exists grantee_b;
      create role grantee_a;
      create role grantee_b;
      create table public.priv_demo (id int primary key, data text);
      grant select, insert on public.priv_demo to grantee_a;
      grant update (data) on public.priv_demo to grantee_b with grant option;
      grant select on public.priv_demo to public;
    `)

    // list(): default and schema-filtered combos. RAW comparison -- no
    // normalization, no sorting of rows or the privileges array.
    for (const options of [{}, { includedSchemas: ['public'] }, { excludedSchemas: ['public'] }]) {
      const legacy = await pgMeta.tablePrivileges.list(options)
      const scoped = await pgMeta.tablePrivileges.list({ ...options, scoped: true })
      const legacyRes = legacy.zod.parse(await executeQuery(legacy.sql)) as PrivRow[]
      const scopedRes = scoped.zod.parse(await executeQuery(scoped.sql)) as PrivRow[]
      expect(scopedRes, `list options: ${JSON.stringify(options)}`).toEqual(legacyRes)
    }

    // The scoped path must surface the PUBLIC grantee for priv_demo.
    const { sql, zod } = await pgMeta.tablePrivileges.list({
      includedSchemas: ['public'],
      scoped: true,
    })
    const rows = zod.parse(await executeQuery(sql)) as PrivRow[]
    const demo = rows.find((r) => r.name === 'priv_demo')!
    expect(demo.privileges.some((p) => p.grantee === 'PUBLIC')).toBe(true)

    // retrieve() by id and by schema+name.
    const legacyById = await pgMeta.tablePrivileges.retrieve({ id: demo.relation_id })
    const scopedById = await pgMeta.tablePrivileges.retrieve({
      id: demo.relation_id,
      scoped: true,
    })
    expect(scopedById.zod.parse((await executeQuery(scopedById.sql))[0])).toEqual(
      legacyById.zod.parse((await executeQuery(legacyById.sql))[0])
    )

    const legacyByName = await pgMeta.tablePrivileges.retrieve({
      name: 'priv_demo',
      schema: 'public',
    })
    const scopedByName = await pgMeta.tablePrivileges.retrieve({
      name: 'priv_demo',
      schema: 'public',
      scoped: true,
    })
    expect(scopedByName.zod.parse((await executeQuery(scopedByName.sql))[0])).toEqual(
      legacyByName.zod.parse((await executeQuery(legacyByName.sql))[0])
    )
  }
)

withTestDatabase('revoke & grant table privileges', async ({ executeQuery }) => {
  // Get initial table privileges
  const { sql: listSql, zod: listZod } = await pgMeta.tablePrivileges.list()
  const listRes = listZod.parse(await executeQuery(listSql))
  const { relation_id } = listRes.find(
    ({ schema, name }) => schema === 'public' && name === 'todos'
  )!

  // Revoke all privileges
  const { sql: revokeSql } = pgMeta.tablePrivileges.revoke([
    {
      relationId: relation_id,
      grantee: 'postgres',
      privilegeType: 'ALL',
    },
  ])
  await executeQuery(revokeSql)

  // Verify privileges were revoked
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.tablePrivileges.retrieve({
    id: relation_id,
  })
  let privs = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(privs).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "todos",
      "privileges": [],
      "relation_id": Any<Number>,
      "schema": "public",
    }
  `
  )

  // Grant all privileges back
  const { sql: grantSql } = pgMeta.tablePrivileges.grant([
    {
      relationId: relation_id,
      grantee: 'postgres',
      privilegeType: 'ALL',
    },
  ])
  await executeQuery(grantSql)

  // Verify privileges were granted
  const { sql: verifyGrantSql } = await pgMeta.tablePrivileges.retrieve({ id: relation_id })
  privs = retrieveZod.parse((await executeQuery(verifyGrantSql))[0])
  expect(privs).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "todos",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "public",
    }
  `
  )
})

withTestDatabase(
  'revoke & grant table privileges w/ quoted table name',
  async ({ executeQuery }) => {
    // Create test role and schema
    await executeQuery(`create role r; create schema "s 1"; create table "s 1"."t 1"();`)

    // Get table privileges
    const { sql: listSql, zod: listZod } = await pgMeta.tablePrivileges.list()
    const listRes = listZod.parse(await executeQuery(listSql))
    const { relation_id } = listRes.find(({ schema, name }) => schema === 's 1' && name === 't 1')!

    // Grant all privileges
    const { sql: grantSql } = pgMeta.tablePrivileges.grant([
      {
        relationId: relation_id,
        grantee: 'r',
        privilegeType: 'ALL',
      },
    ])
    await executeQuery(grantSql)

    // Verify privileges were granted
    const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.tablePrivileges.retrieve({
      id: relation_id,
    })
    let privs = retrieveZod.parse((await executeQuery(retrieveSql))[0])
    expect(privs).toMatchInlineSnapshot(
      { relation_id: expect.any(Number) },
      `
    {
      "kind": "table",
      "name": "t 1",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "s 1",
    }
  `
    )

    // Revoke all privileges
    const { sql: revokeSql } = pgMeta.tablePrivileges.revoke([
      {
        relationId: relation_id,
        grantee: 'r',
        privilegeType: 'ALL',
      },
    ])
    await executeQuery(revokeSql)

    // Verify privileges were revoked
    const { sql: verifyRevokeSql } = await pgMeta.tablePrivileges.retrieve({ id: relation_id })
    privs = retrieveZod.parse((await executeQuery(verifyRevokeSql))[0])
    expect(privs).toMatchInlineSnapshot(
      { relation_id: expect.any(Number) },
      `
    {
      "kind": "table",
      "name": "t 1",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "s 1",
    }
  `
    )
  }
)

// Reads grants through `information_schema` instead of snapshotting the whole privilege list, so
// the assertions don't depend on which privileges a Postgres version adds (e.g. `MAINTAIN`).
const tableGrants = async (
  executeQuery: <T = any>(query: string) => Promise<T>,
  schema: string,
  table: string,
  grantees: string[]
) => {
  const rows = await executeQuery<
    { grantee: string; privilege_type: string; is_grantable: string }[]
  >(`
    select grantee, privilege_type, is_grantable
    from information_schema.table_privileges
    where table_schema = '${schema.replaceAll("'", "''")}'
      and table_name = '${table.replaceAll("'", "''")}'
      and grantee in (${grantees.map((g) => `'${g.replaceAll("'", "''")}'`).join(', ')})
    order by grantee, privilege_type
  `)
  return rows.map((r) => `${r.grantee}:${r.privilege_type}:${r.is_grantable}`)
}

withTestDatabase(
  'grant & revoke table privileges in a schema and table that need quoting',
  async ({ executeQuery }) => {
    const role = `tp_quoted_${Date.now()}`
    await executeQuery(
      `create role ${role}; create schema "My Schema"; create table "My Schema"."Weird Table"();`
    )
    try {
      const { sql: listSql, zod: listZod } = await pgMeta.tablePrivileges.list()
      const { relation_id } = listZod
        .parse(await executeQuery(listSql))
        .find(({ schema, name }) => schema === 'My Schema' && name === 'Weird Table')!

      // `isGrantable`, a role grantee and the `public` pseudo-role (any casing) in one call.
      await executeQuery(
        pgMeta.tablePrivileges.grant([
          { relationId: relation_id, grantee: role, privilegeType: 'SELECT' },
          { relationId: relation_id, grantee: role, privilegeType: 'INSERT', isGrantable: true },
          { relationId: relation_id, grantee: 'PUBLIC', privilegeType: 'UPDATE' },
        ]).sql
      )
      expect(await tableGrants(executeQuery, 'My Schema', 'Weird Table', [role, 'PUBLIC'])).toEqual(
        [`PUBLIC:UPDATE:NO`, `${role}:INSERT:YES`, `${role}:SELECT:NO`]
      )

      await executeQuery(
        pgMeta.tablePrivileges.revoke([
          { relationId: relation_id, grantee: role, privilegeType: 'INSERT' },
          { relationId: relation_id, grantee: 'public', privilegeType: 'UPDATE' },
        ]).sql
      )
      expect(await tableGrants(executeQuery, 'My Schema', 'Weird Table', [role, 'PUBLIC'])).toEqual(
        [`${role}:SELECT:NO`]
      )
    } finally {
      await executeQuery(`drop owned by ${role}; drop role ${role};`)
    }
  }
)

withTestDatabase(
  'grant & revoke table privileges for a role whose name has quotes',
  async ({ executeQuery }) => {
    const role = `it's a "role" ${Date.now()}`
    const quotedRole = `"${role.replaceAll('"', '""')}"`
    await executeQuery(`create role ${quotedRole};`)
    try {
      const { sql: listSql, zod: listZod } = await pgMeta.tablePrivileges.list()
      const { relation_id } = listZod
        .parse(await executeQuery(listSql))
        .find(({ schema, name }) => schema === 'public' && name === 'todos')!

      await executeQuery(
        pgMeta.tablePrivileges.grant([
          { relationId: relation_id, grantee: role, privilegeType: 'SELECT', isGrantable: true },
        ]).sql
      )
      expect(await tableGrants(executeQuery, 'public', 'todos', [role])).toEqual([
        `${role}:SELECT:YES`,
      ])

      await executeQuery(
        pgMeta.tablePrivileges.revoke([
          { relationId: relation_id, grantee: role, privilegeType: 'SELECT' },
        ]).sql
      )
      expect(await tableGrants(executeQuery, 'public', 'todos', [role])).toEqual([])
    } finally {
      await executeQuery(`drop owned by ${quotedRole}; drop role ${quotedRole};`)
    }
  }
)

withTestDatabase(
  'grant table privileges for a table that does not exist',
  async ({ executeQuery }) => {
    // A dropped table leaves the subselects with no row, which `%I` rejects.
    await expect(
      executeQuery(
        pgMeta.tablePrivileges.grant([
          { relationId: 2147483000, grantee: 'postgres', privilegeType: 'SELECT' },
        ]).sql
      )
    ).rejects.toThrow()
  }
)
