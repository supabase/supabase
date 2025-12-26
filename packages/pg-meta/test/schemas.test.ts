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

// Example of refactored tests using the wrapper
withTestDatabase('list with system schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.schemas.list({ includeSystemSchemas: true })
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ name }) => name === 'pg_catalog')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": "system catalog schema",
      "id": Any<Number>,
      "name": "pg_catalog",
      "owner": "postgres",
    }
  `
  )
})

withTestDatabase('list without system schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.schemas.list({ includeSystemSchemas: false })
  const rq = await executeQuery<typeof zod._type>(sql)
  const res = zod.parse(rq)

  expect(res.find(({ name }) => name === 'pg_catalog')).toMatchInlineSnapshot(`undefined`)
  expect(res.find(({ name }) => name === 'public')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": "standard public schema",
      "id": Any<Number>,
      "name": "public",
      "owner": "postgres",
    }
  `
  )
})

withTestDatabase('retrieve, create, update, delete', async ({ executeQuery }) => {
  // Create schema
  const { sql: createSql } = await pgMeta.schemas.create({ name: 's' })
  await executeQuery(createSql)

  // Get the created schema
  const { sql: retrieveSql, zod } = await pgMeta.schemas.retrieve({ name: 's' })
  const createRes = zod.parse((await executeQuery(retrieveSql))[0])
  expect(createRes).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": null,
      "id": Any<Number>,
      "name": "s",
      "owner": "postgres",
    }
  `
  )

  // Retrieve schema again to verify
  const { sql: retrieveSql2, zod: retrieveZod } = await pgMeta.schemas.retrieve({
    id: createRes!.id,
  })
  const retrieveRes = retrieveZod.parse((await executeQuery(retrieveSql2))[0])
  expect(retrieveRes).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": null,
      "id": Any<Number>,
      "name": "s",
      "owner": "postgres",
    }
  `
  )

  // Update schema
  const { sql: updateSql } = await pgMeta.schemas.update(
    { id: createRes!.id },
    {
      name: 'ss',
      owner: 'postgres',
    }
  )
  await executeQuery(updateSql)

  // Get the updated schema
  const { sql: retrieveUpdatedSql, zod: retrieveUpdatedZod } = await pgMeta.schemas.retrieve({
    name: 'ss',
  })
  const updateRes = retrieveUpdatedZod.parse((await executeQuery(retrieveUpdatedSql))[0])
  expect(updateRes).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": null,
      "id": Any<Number>,
      "name": "ss",
      "owner": "postgres",
    }
  `
  )

  // Delete schema
  const { sql: deleteSql } = await pgMeta.schemas.remove({ id: updateRes!.id })
  await executeQuery(deleteSql)

  // Verify deletion
  const { sql: finalRetrieveSql } = await pgMeta.schemas.retrieve({ id: updateRes!.id })
  const finalRes = await executeQuery(finalRetrieveSql)
  expect(finalRes).toMatchInlineSnapshot(`[]`)
})
