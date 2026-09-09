import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

// The update/remove DO blocks interpolate identifier values via literal() into
// their dollar-quoted bodies. literal() guards quotes but not a value containing
// $$ terminating the fixed $$ delimiter of the block itself.
test('not-found lookups still raise the intended message when the name contains dollar quotes', async () => {
  const db = await createTestDatabase()
  try {
    const { sql: updateSql } = pgMeta.roles.update({ name: 'roles_$$_missing' }, { name: 'x' })
    await expect(db.executeQuery(updateSql)).rejects.toThrow(/Cannot find role/)

    const { sql: removeSql } = pgMeta.roles.remove({ name: 'roles_$$_missing' })
    await expect(db.executeQuery(removeSql)).rejects.toThrow(/Cannot find role/)
  } finally {
    await db.cleanup()
  }
})
