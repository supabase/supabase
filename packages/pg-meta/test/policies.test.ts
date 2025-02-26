import { expect, test } from 'vitest'
import pgMeta from '../src/index'
import { createTestDatabase, cleanupRoot } from './db/utils'
import { afterAll } from 'vitest'

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

withTestDatabase('list policies', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.policies.list()
  const res = zod.parse(await executeQuery(sql))
  const policy = res.find(({ name }) => name === 'categories_update_policy')

  expect(policy).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
    {
      "action": "PERMISSIVE",
      "check": null,
      "command": "UPDATE",
      "definition": "(current_setting('my.username'::text) = name)",
      "id": Any<Number>,
      "name": "categories_update_policy",
      "roles": [
        "postgres",
      ],
      "schema": "public",
      "table": "category",
      "table_id": Any<Number>,
    }
    `
  )
})

withTestDatabase('list policies with included schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.policies.list({
    includedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  expect(res.length).toBeGreaterThan(0)
  res.forEach((policy) => {
    expect(policy.schema).toBe('public')
  })
})

withTestDatabase('retrieve, create, update, delete policies', async ({ executeQuery }) => {
  // Create policy
  const { sql: createSql } = await pgMeta.policies.create({
    name: 'test_policy',
    schema: 'public',
    table: 'memes',
    action: 'RESTRICTIVE',
  })
  await executeQuery(createSql)

  // List to get the created policy
  const { sql: listSql, zod: listZod } = await pgMeta.policies.list()
  const policies = listZod.parse(await executeQuery(listSql))
  const createdPolicy = policies.find((p) => p.name === 'test_policy')

  expect(createdPolicy).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
    {
      "action": "RESTRICTIVE",
      "check": null,
      "command": "ALL",
      "definition": null,
      "id": Any<Number>,
      "name": "test_policy",
      "roles": [
        "public",
      ],
      "schema": "public",
      "table": "memes",
      "table_id": Any<Number>,
    }
    `
  )

  // Update policy
  const { sql: updateSql } = await pgMeta.policies.update(
    { id: createdPolicy!.id },
    {
      name: 'updated_policy',
      definition: "current_setting('my.username') IN (name)",
      check: "current_setting('my.username') IN (name)",
      roles: ['postgres'],
    }
  )
  await executeQuery(updateSql)

  // Retrieve updated policy
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.policies.retrieve({
    id: createdPolicy!.id,
  })
  const updatedPolicy = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  expect(updatedPolicy).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
    {
      "action": "RESTRICTIVE",
      "check": "(current_setting('my.username'::text) = name)",
      "command": "ALL",
      "definition": "(current_setting('my.username'::text) = name)",
      "id": Any<Number>,
      "name": "updated_policy",
      "roles": [
        "postgres",
      ],
      "schema": "public",
      "table": "memes",
      "table_id": Any<Number>,
    }
    `
  )

  // Remove policy
  const { sql: removeSql } = await pgMeta.policies.remove({ id: updatedPolicy!.id })
  await executeQuery(removeSql)

  // Verify policy is removed
  const { sql: verifyRemoveSql } = await pgMeta.policies.retrieve({
    id: updatedPolicy!.id,
  })
  const result = await executeQuery(verifyRemoveSql)
  expect(result).toHaveLength(0)
})
