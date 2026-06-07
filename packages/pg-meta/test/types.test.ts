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

withTestDatabase('list types', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.types.list()
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ name }) => name === 'user_status')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "attributes": [],
      "comment": null,
      "enums": [
        "ACTIVE",
        "INACTIVE",
      ],
      "format": "user_status",
      "id": Any<Number>,
      "name": "user_status",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('list types with included schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.types.list({
    includedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  expect(res.length).toBeGreaterThan(0)
  res.forEach((type) => {
    expect(type.schema).toBe('public')
  })
})

withTestDatabase('list types with excluded schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.types.list({
    excludedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  res.forEach((type) => {
    expect(type.schema).not.toBe('public')
  })
})

withTestDatabase(
  'list types with excluded schemas and include System Schemas',
  async ({ executeQuery }) => {
    const { sql, zod } = await pgMeta.types.list({
      excludedSchemas: ['public'],
      includeSystemSchemas: true,
    })
    const res = zod.parse(await executeQuery(sql))

    expect(res.length).toBeGreaterThan(0)
    res.forEach((type) => {
      expect(type.schema).not.toBe('public')
    })
  }
)

withTestDatabase('composite type attributes', async ({ executeQuery }) => {
  await executeQuery(`create type test_composite as (id int8, data text);`)

  const { sql, zod } = await pgMeta.types.list()
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ name }) => name === 'test_composite')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "attributes": [
        {
          "name": "id",
          "type_id": 20,
        },
        {
          "name": "data",
          "type_id": 25,
        },
      ],
      "comment": null,
      "enums": [],
      "format": "test_composite",
      "id": Any<Number>,
      "name": "test_composite",
      "schema": "public",
    }
  `
  )
})
