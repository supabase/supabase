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
withTestDatabase('list roles', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.roles.list()
  const res = zod.parse(await executeQuery(sql))

  let role = res.find(({ name }) => name === 'postgres')

  expect(role).toMatchInlineSnapshot(
    { activeConnections: expect.any(Number), id: expect.any(Number) },
    `
    {
      "activeConnections": Any<Number>,
      "canBypassRls": true,
      "canCreateDb": true,
      "canCreateRole": true,
      "canLogin": true,
      "config": {},
      "connectionLimit": 100,
      "id": Any<Number>,
      "inheritRole": true,
      "isReplicationRole": true,
      "isSuperuser": true,
      "name": "postgres",
      "validUntil": null,
    }
  `
  )

  // pg_monitor is a predefined role. `includeDefaultRoles` defaults to false,
  // so it shouldn't be included in the result.
  role = res.find(({ name }) => name === 'pg_monitor')

  expect(role).toMatchInlineSnapshot(`undefined`)
})

withTestDatabase('list roles w/ default roles', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.roles.list({ includeDefaultRoles: true })
  const res = zod.parse(await executeQuery(sql))

  const role = res.find(({ name }) => name === 'pg_monitor')

  expect(role).toMatchInlineSnapshot(
    {
      activeConnections: expect.any(Number),
      id: expect.any(Number),
    },
    `
    {
      "activeConnections": Any<Number>,
      "canBypassRls": false,
      "canCreateDb": false,
      "canCreateRole": false,
      "canLogin": false,
      "config": {},
      "connectionLimit": 100,
      "id": Any<Number>,
      "inheritRole": true,
      "isReplicationRole": false,
      "isSuperuser": false,
      "name": "pg_monitor",
      "validUntil": null,
    }
  `
  )
})

withTestDatabase('retrieve, create, update, delete roles', async ({ executeQuery }) => {
  // Create role
  const { sql: createSql } = pgMeta.roles.create({
    name: 'r1',
    isSuperuser: true,
    canCreateDb: true,
    canCreateRole: true,
    inheritRole: false,
    canLogin: true,
    isReplicationRole: true,
    canBypassRls: true,
    connectionLimit: 100,
    validUntil: '2020-01-01T00:00:00.000Z',
    config: { search_path: 'extension, public' },
  })
  await executeQuery(createSql)

  // Retrieve the created role using list
  const { sql: listSql, zod: listZod } = await pgMeta.roles.list()
  const roles = listZod.parse(await executeQuery(listSql))
  const createdRole = roles.find((role) => role.name === 'r1')
  expect(createdRole).toMatchInlineSnapshot(
    { id: expect.any(Number), activeConnections: expect.any(Number) },
    `
    {
      "activeConnections": Any<Number>,
      "canBypassRls": true,
      "canCreateDb": true,
      "canCreateRole": true,
      "canLogin": true,
      "config": {
        "search_path": ""extension, public"",
      },
      "connectionLimit": 100,
      "id": Any<Number>,
      "inheritRole": false,
      "isReplicationRole": true,
      "isSuperuser": true,
      "name": "r1",
      "validUntil": "2020-01-01 00:00:00+00",
    }
  `
  )

  // Remove role
  const { sql: removeSql } = pgMeta.roles.remove({ id: createdRole!.id })
  await executeQuery(removeSql)

  // Create a new role for update test
  const { sql: createNewSql } = pgMeta.roles.create({
    name: 'r1',
  })
  await executeQuery(createNewSql)

  // Get the role ID for update
  const { sql: getIdSql, zod: getIdZod } = await pgMeta.roles.list()
  const roleForUpdate = getIdZod
    .parse(await executeQuery(getIdSql))
    .find((role) => role.name === 'r1')

  // Update role with ISO string date
  const { sql: updateSql } = pgMeta.roles.update(
    { id: roleForUpdate!.id },
    {
      name: 'rr',
      isSuperuser: true,
      canCreateDb: true,
      canCreateRole: true,
      inheritRole: false,
      canLogin: true,
      isReplicationRole: true,
      canBypassRls: true,
      connectionLimit: 100,
      validUntil: '2020-01-01T00:00:00.000Z',
    }
  )
  await executeQuery(updateSql)

  // Verify update using retrieve
  const { sql: retrieveUpdatedSql, zod: retrieveZod } = pgMeta.roles.retrieve({
    id: roleForUpdate!.id,
  })
  const updatedRole = retrieveZod.parse((await executeQuery(retrieveUpdatedSql))[0])
  expect(updatedRole).toMatchInlineSnapshot(
    { id: expect.any(Number), activeConnections: expect.any(Number) },
    `
    {
      "activeConnections": Any<Number>,
      "canBypassRls": true,
      "canCreateDb": true,
      "canCreateRole": true,
      "canLogin": true,
      "config": {},
      "connectionLimit": 100,
      "id": Any<Number>,
      "inheritRole": false,
      "isReplicationRole": true,
      "isSuperuser": true,
      "name": "rr",
      "validUntil": "2020-01-01 00:00:00+00",
    }
  `
  )

  // Create role with config
  const { sql: createConfigSql } = pgMeta.roles.create({
    name: 'config_role',
    config: { search_path: 'public', log_statement: 'all' },
  })
  await executeQuery(createConfigSql)

  // Verify config role using list
  const { sql: listConfigSql, zod: listConfigZod } = await pgMeta.roles.list()
  const configRole = listConfigZod
    .parse(await executeQuery(listConfigSql))
    .find((role) => role.name === 'config_role')
  expect(configRole).toMatchInlineSnapshot(
    { id: expect.any(Number), activeConnections: expect.any(Number) },
    `
    {
      "activeConnections": Any<Number>,
      "canBypassRls": false,
      "canCreateDb": false,
      "canCreateRole": false,
      "canLogin": false,
      "config": {
        "log_statement": "all",
        "search_path": "public",
      },
      "connectionLimit": 100,
      "id": Any<Number>,
      "inheritRole": true,
      "isReplicationRole": false,
      "isSuperuser": false,
      "name": "config_role",
      "validUntil": null,
    }
  `
  )

  // Remove role and verify it's gone
  const { sql: finalRemoveSql } = pgMeta.roles.remove({ id: configRole!.id })
  await executeQuery(finalRemoveSql)

  const { sql: finalListSql, zod: finalListZod } = await pgMeta.roles.list()
  const finalRoles = finalListZod.parse(await executeQuery(finalListSql))
  expect(finalRoles.find((role) => role.name === 'config_role')).toBeUndefined()
})
