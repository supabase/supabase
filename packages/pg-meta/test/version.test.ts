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

withTestDatabase('retrieve version info', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.version.retrieve()
  const res = zod.parse((await executeQuery(sql))[0])

  expect(res).toMatchInlineSnapshot(
    {
      active_connections: expect.any(Number),
      max_connections: expect.any(Number),
      version: expect.stringMatching(/^PostgreSQL/),
      version_number: expect.any(Number),
    },
    `
    {
      "active_connections": Any<Number>,
      "max_connections": Any<Number>,
      "version": StringMatching /\\^PostgreSQL/,
      "version_number": Any<Number>,
    }
    `
  )
})
