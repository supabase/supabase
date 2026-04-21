import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

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

withTestDatabase('list config', async ({ executeQuery }) => {
  const { sql, zod } = pgMeta.config.list()
  const res = zod.parse(await executeQuery(sql))

  // Test for a known config value
  const autovacuumConfig = res.find(({ name }) => name === 'autovacuum')
  expect(autovacuumConfig).toMatchInlineSnapshot(`
    {
      "boot_val": "on",
      "category": "Autovacuum",
      "context": "sighup",
      "enumvals": null,
      "extra_desc": null,
      "group": "Autovacuum",
      "max_val": null,
      "min_val": null,
      "name": "autovacuum",
      "pending_restart": false,
      "reset_val": "on",
      "setting": "on",
      "short_desc": "Starts the autovacuum subprocess.",
      "source": "default",
      "sourcefile": null,
      "sourceline": null,
      "subgroup": "",
      "unit": null,
      "vartype": "bool",
    }
  `)
})

withTestDatabase('list config with pagination', async ({ executeQuery }) => {
  const { sql, zod } = pgMeta.config.list({ limit: 5, offset: 0 })
  const res = zod.parse(await executeQuery(sql))

  expect(res).toHaveLength(5)
})
