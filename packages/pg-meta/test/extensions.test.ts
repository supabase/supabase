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

withTestDatabase('list extensions', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.extensions.list()
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ name }) => name === 'hstore')).toMatchInlineSnapshot(
    { default_version: expect.stringMatching(/^\d+.\d+$/) },
    `
    {
      "comment": "data type for storing sets of (key, value) pairs",
      "default_version": StringMatching /\\^\\\\d\\+\\.\\\\d\\+\\$/,
      "installed_version": null,
      "name": "hstore",
      "schema": null,
    }
  `
  )
})

withTestDatabase('retrieve, create, update, delete extension', async ({ executeQuery }) => {
  // Create extensions schema
  await executeQuery('CREATE SCHEMA extensions;')
  // Create extension
  const { sql: createSql } = await pgMeta.extensions.create({ name: 'hstore', version: '1.4' })
  await executeQuery(createSql)

  // Retrieve extension
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.extensions.retrieve({
    name: 'hstore',
  })
  const retrieve = await executeQuery(retrieveSql)
  const res = retrieveZod.parse(retrieve[0])
  expect(res).toMatchInlineSnapshot(
    {
      default_version: expect.stringMatching(/^\d+.\d+$/),
    },
    `
    {
      "comment": "data type for storing sets of (key, value) pairs",
      "default_version": StringMatching /\\^\\\\d\\+\\.\\\\d\\+\\$/,
      "installed_version": "1.4",
      "name": "hstore",
      "schema": "public",
    }
  `
  )

  // Update extension
  const { sql: updateSql } = await pgMeta.extensions.update('hstore', {
    update: true,
    schema: 'extensions',
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: verifyUpdateSql } = await pgMeta.extensions.retrieve({ name: 'hstore' })
  const updateRes = retrieveZod.parse((await executeQuery(verifyUpdateSql))[0])
  expect(updateRes).toMatchInlineSnapshot(
    {
      default_version: expect.stringMatching(/^\d+.\d+$/),
      installed_version: expect.stringMatching(/^\d+.\d+$/),
    },
    `
    {
      "comment": "data type for storing sets of (key, value) pairs",
      "default_version": StringMatching /\\^\\\\d\\+\\.\\\\d\\+\\$/,
      "installed_version": StringMatching /\\^\\\\d\\+\\.\\\\d\\+\\$/,
      "name": "hstore",
      "schema": "extensions",
    }
  `
  )

  // Remove extension
  const { sql: removeSql } = await pgMeta.extensions.remove('hstore')
  await executeQuery(removeSql)

  // Verify removal
  const { sql: verifyRemoveSql } = await pgMeta.extensions.retrieve({ name: 'hstore' })
  const finalRes = retrieveZod.parse((await executeQuery(verifyRemoveSql))[0])
  expect(finalRes).toMatchInlineSnapshot(
    { default_version: expect.stringMatching(/^\d+.\d+$/) },
    `
    {
      "comment": "data type for storing sets of (key, value) pairs",
      "default_version": StringMatching /\\^\\\\d\\+\\.\\\\d\\+\\$/,
      "installed_version": null,
      "name": "hstore",
      "schema": null,
    }
  `
  )
})
