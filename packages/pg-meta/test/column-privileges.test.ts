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

withTestDatabase('list column privileges', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.columnPrivileges.list()
  const res = zod.parse(await executeQuery(sql))
  const column = res.find(
    ({ relation_schema, relation_name, column_name }) =>
      relation_schema === 'public' && relation_name === 'todos' && column_name === 'id'
  )!

  // We don't guarantee order of privileges, but we want to keep the snapshots consistent.
  column.privileges.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  expect(column).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "id",
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
          "privilege_type": "REFERENCES",
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
      ],
      "relation_name": "todos",
      "relation_schema": "public",
    }
  `
  )
})

withTestDatabase('revoke & grant column privileges', async ({ executeQuery }) => {
  const testRole = `test_role_${Date.now()}`
  // Create test role
  await executeQuery(`create role ${testRole};`)

  // Get initial column privileges
  const { sql: listSql, zod: listZod } = await pgMeta.columnPrivileges.list()
  const listRes = listZod.parse(await executeQuery(listSql))
  const { column_id } = listRes.find(
    ({ relation_schema, relation_name, column_name }) =>
      relation_schema === 'public' && relation_name === 'todos' && column_name === 'id'
  )!
  const { sql: listSqlTodos } = await pgMeta.columnPrivileges.list({ columnIds: [column_id] })

  // Grant all privileges
  const { sql: grantSql } = pgMeta.columnPrivileges.grant([
    {
      columnId: column_id,
      grantee: testRole,
      privilegeType: 'ALL',
    },
  ])
  await executeQuery(grantSql)

  let privs = listZod.parse(await executeQuery(listSqlTodos))
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "id",
      "privileges": [
        {
          "grantee": "${testRole}",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "${testRole}",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "${testRole}",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "${testRole}",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
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
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_name": "todos",
      "relation_schema": "public",
    }
  `
  )

  // Revoke all privileges
  const { sql: revokeSql } = pgMeta.columnPrivileges.revoke([
    {
      columnId: column_id,
      grantee: testRole,
      privilegeType: 'ALL',
    },
  ])
  await executeQuery(revokeSql)

  // Verify privileges were revoked
  privs = listZod.parse(await executeQuery(listSqlTodos))
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "id",
      "privileges": [
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
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_name": "todos",
      "relation_schema": "public",
    }
  `
  )
})

withTestDatabase(
  'revoke & grant column privileges w/ quoted column name',
  async ({ executeQuery }) => {
    const testRole = `test_role_${Date.now()}`
    // Create test role and table with quoted names
    await executeQuery(`create role ${testRole}; create table "t 1"("c 1" int8);`)

    // Get column privileges
    const { sql: listSql, zod: listZod } = await pgMeta.columnPrivileges.list()
    const listRes = listZod.parse(await executeQuery(listSql))
    const { column_id } = listRes.find(
      ({ relation_name, column_name }) => relation_name === 't 1' && column_name === 'c 1'
    )!
    const { sql: listSqlT1 } = await pgMeta.columnPrivileges.list({ columnIds: [column_id] })

    // Grant all privileges
    const { sql: grantSql } = pgMeta.columnPrivileges.grant([
      {
        columnId: column_id,
        grantee: testRole,
        privilegeType: 'ALL',
      },
    ])
    await executeQuery(grantSql)

    // Verify privileges were granted
    let privs = listZod.parse(await executeQuery(listSqlT1))
    expect(privs.length).toBe(1)
    expect(privs[0]).toMatchInlineSnapshot(
      { column_id: expect.stringMatching(/^\d+\.\d+$/) },
      `
      {
        "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
        "column_name": "c 1",
        "privileges": [
          {
            "grantee": "${testRole}",
            "grantor": "postgres",
            "is_grantable": false,
            "privilege_type": "UPDATE",
          },
          {
            "grantee": "${testRole}",
            "grantor": "postgres",
            "is_grantable": false,
            "privilege_type": "SELECT",
          },
          {
            "grantee": "${testRole}",
            "grantor": "postgres",
            "is_grantable": false,
            "privilege_type": "REFERENCES",
          },
          {
            "grantee": "${testRole}",
            "grantor": "postgres",
            "is_grantable": false,
            "privilege_type": "INSERT",
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
            "privilege_type": "REFERENCES",
          },
          {
            "grantee": "postgres",
            "grantor": "postgres",
            "is_grantable": false,
            "privilege_type": "INSERT",
          },
        ],
        "relation_name": "t 1",
        "relation_schema": "public",
      }
    `
    )
    // Revoke all privileges
    const { sql: revokeSql } = pgMeta.columnPrivileges.revoke([
      {
        columnId: column_id,
        grantee: testRole,
        privilegeType: 'ALL',
      },
    ])
    await executeQuery(revokeSql)

    // Verify privileges were revoked
    privs = listZod.parse(await executeQuery(listSqlT1))
    expect(privs.length).toBe(1)
    expect(privs[0]).toMatchInlineSnapshot(
      { column_id: expect.stringMatching(/^\d+\.\d+$/) },
      `
      {
        "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
        "column_name": "c 1",
        "privileges": [
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
            "privilege_type": "REFERENCES",
          },
          {
            "grantee": "postgres",
            "grantor": "postgres",
            "is_grantable": false,
            "privilege_type": "INSERT",
          },
        ],
        "relation_name": "t 1",
        "relation_schema": "public",
      }
    `
    )
  }
)

withTestDatabase('scoped list matches the legacy path row-for-row', async ({ executeQuery }) => {
  await executeQuery(`
    drop role if exists col_grantee_a;
    drop role if exists col_grantee_b;
    create role col_grantee_a;
    create role col_grantee_b;
    create table public.col_priv_demo (id int primary key, data text, extra text);
    grant select, insert on public.col_priv_demo to col_grantee_a;
    grant update (data) on public.col_priv_demo to col_grantee_b with grant option;
    grant references (extra) on public.col_priv_demo to col_grantee_a;
    grant select on public.col_priv_demo to public;
    create view public.col_priv_view as select id, data from public.col_priv_demo;
    grant select (id) on public.col_priv_view to col_grantee_b;
  `)

  // Neither path orders rows or the privileges array (see the note on the first
  // test in this file), and the two plans emit them in different orders, so
  // compare on normalized copies.
  const normalize = <T extends { column_id: string; privileges: Array<unknown> }>(rows: Array<T>) =>
    rows
      .map((row) => ({
        ...row,
        privileges: [...row.privileges].sort((a, b) =>
          JSON.stringify(a).localeCompare(JSON.stringify(b))
        ),
      }))
      .sort((a, b) => a.column_id.localeCompare(b.column_id))

  for (const options of [
    {},
    { includedSchemas: ['public'] },
    { excludedSchemas: ['public'] },
    { includedSchemas: ['public'], relationName: 'col_priv_demo' },
    { includedSchemas: ['public'], relationName: 'col_priv_view' },
    { includedSchemas: ['public'], relationName: 'does_not_exist' },
    { includeSystemSchemas: true, includedSchemas: ['public'] },
  ]) {
    const legacy = pgMeta.columnPrivileges.list(options)
    const scoped = pgMeta.columnPrivileges.list({ ...options, scoped: true })
    const legacyRes = legacy.zod.parse(await executeQuery(legacy.sql))
    const scopedRes = scoped.zod.parse(await executeQuery(scoped.sql))
    expect(normalize(scopedRes), `list options: ${JSON.stringify(options)}`).toEqual(
      normalize(legacyRes)
    )
    // Row counts must match exactly, independent of the normalization above.
    expect(scopedRes.length, `row count for options: ${JSON.stringify(options)}`).toBe(
      legacyRes.length
    )
  }

  // The scoped path must surface the PUBLIC grantee, and the column-level grants
  // that only the second UNION arm can produce.
  const { sql, zod } = pgMeta.columnPrivileges.list({
    includedSchemas: ['public'],
    relationName: 'col_priv_demo',
    scoped: true,
  })
  const rows = zod.parse(await executeQuery(sql))
  const dataColumn = rows.find((r) => r.column_name === 'data')!
  expect(rows.map((r) => r.column_name).sort()).toEqual(['data', 'extra', 'id'])
  expect(dataColumn.privileges.some((p) => p.grantee === 'PUBLIC')).toBe(true)
  expect(
    dataColumn.privileges.some(
      (p) => p.grantee === 'col_grantee_b' && p.privilege_type === 'UPDATE' && p.is_grantable
    )
  ).toBe(true)

  // columnIds: the scoped path prunes pg_class by relation oid and keeps the
  // exact attnum predicate outside, so it must still match legacy exactly.
  const columnIds = rows.map((r) => r.column_id).slice(0, 2)
  const legacyByIds = pgMeta.columnPrivileges.list({ columnIds })
  const scopedByIds = pgMeta.columnPrivileges.list({ columnIds, scoped: true })
  expect(normalize(scopedByIds.zod.parse(await executeQuery(scopedByIds.sql)))).toEqual(
    normalize(legacyByIds.zod.parse(await executeQuery(legacyByIds.sql)))
  )
})

const columnGrants = async (
  executeQuery: <T = any>(query: string) => Promise<T>,
  schema: string,
  table: string,
  grantees: string[]
) => {
  const rows = await executeQuery<
    { grantee: string; column_name: string; privilege_type: string; is_grantable: string }[]
  >(`
    select grantee, column_name, privilege_type, is_grantable
    from information_schema.column_privileges
    where table_schema = '${schema.replaceAll("'", "''")}'
      and table_name = '${table.replaceAll("'", "''")}'
      and grantee in (${grantees.map((g) => `'${g.replaceAll("'", "''")}'`).join(', ')})
    order by grantee, column_name, privilege_type
  `)
  return rows.map((r) => `${r.grantee}:${r.column_name}:${r.privilege_type}:${r.is_grantable}`)
}

withTestDatabase(
  'grant & revoke column privileges in a schema, table and column that need quoting',
  async ({ executeQuery }) => {
    const role = `cp_quoted_${Date.now()}`
    await executeQuery(
      `create role ${role}; create schema "My Schema"; create table "My Schema"."Weird Table"("Col A" int, b int);`
    )
    try {
      const { sql: listSql, zod: listZod } = await pgMeta.columnPrivileges.list()
      const rows = listZod.parse(await executeQuery(listSql))
      const columnIdFor = (columnName: string) =>
        rows.find(
          ({ relation_schema, relation_name, column_name }) =>
            relation_schema === 'My Schema' &&
            relation_name === 'Weird Table' &&
            column_name === columnName
        )!.column_id

      await executeQuery(
        pgMeta.columnPrivileges.grant([
          { columnId: columnIdFor('Col A'), grantee: role, privilegeType: 'SELECT' },
          {
            columnId: columnIdFor('Col A'),
            grantee: role,
            privilegeType: 'UPDATE',
            isGrantable: true,
          },
          { columnId: columnIdFor('b'), grantee: 'PUBLIC', privilegeType: 'INSERT' },
        ]).sql
      )
      expect(
        await columnGrants(executeQuery, 'My Schema', 'Weird Table', [role, 'PUBLIC'])
      ).toEqual([`PUBLIC:b:INSERT:NO`, `${role}:Col A:SELECT:NO`, `${role}:Col A:UPDATE:YES`])

      await executeQuery(
        pgMeta.columnPrivileges.revoke([
          { columnId: columnIdFor('Col A'), grantee: role, privilegeType: 'UPDATE' },
          { columnId: columnIdFor('b'), grantee: 'public', privilegeType: 'INSERT' },
        ]).sql
      )
      expect(
        await columnGrants(executeQuery, 'My Schema', 'Weird Table', [role, 'PUBLIC'])
      ).toEqual([`${role}:Col A:SELECT:NO`])
    } finally {
      await executeQuery(`drop owned by ${role}; drop role ${role};`)
    }
  }
)

withTestDatabase(
  'grant & revoke column privileges for a role whose name has quotes',
  async ({ executeQuery }) => {
    const role = `it's a "role" ${Date.now()}`
    const quotedRole = `"${role.replaceAll('"', '""')}"`
    await executeQuery(`create role ${quotedRole};`)
    try {
      const { sql: listSql, zod: listZod } = await pgMeta.columnPrivileges.list()
      const { column_id } = listZod
        .parse(await executeQuery(listSql))
        .find(
          ({ relation_schema, relation_name, column_name }) =>
            relation_schema === 'public' && relation_name === 'todos' && column_name === 'id'
        )!

      await executeQuery(
        pgMeta.columnPrivileges.grant([
          { columnId: column_id, grantee: role, privilegeType: 'SELECT', isGrantable: true },
        ]).sql
      )
      expect(await columnGrants(executeQuery, 'public', 'todos', [role])).toEqual([
        `${role}:id:SELECT:YES`,
      ])

      await executeQuery(
        pgMeta.columnPrivileges.revoke([
          { columnId: column_id, grantee: role, privilegeType: 'SELECT' },
        ]).sql
      )
      expect(await columnGrants(executeQuery, 'public', 'todos', [role])).toEqual([])
    } finally {
      await executeQuery(`drop owned by ${quotedRole}; drop role ${quotedRole};`)
    }
  }
)
