import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

// The update/remove DO blocks raise 'Cannot find role with id %', id without
// declaring `id`, so the not-found path crashed with PL/pgSQL error 42703
// (column "id" does not exist) instead of surfacing the intended message.
test('reports a clear not-found exception when updating or removing a missing role by name', async () => {
  const db = await createTestDatabase()
  try {
    const { sql: updateSql } = pgMeta.roles.update(
      { name: 'roles_raise_missing_role' },
      { name: 'x' }
    )
    await expect(db.executeQuery(updateSql)).rejects.toThrow(
      /Cannot find role with: roles_raise_missing_role/
    )

    const { sql: removeSql } = pgMeta.roles.remove({ name: 'roles_raise_missing_role' })
    await expect(db.executeQuery(removeSql)).rejects.toThrow(
      /Cannot find role with: roles_raise_missing_role/
    )
  } finally {
    await db.cleanup()
  }
})

test('reports a clear not-found exception when updating or removing a missing role by id', async () => {
  const db = await createTestDatabase()
  try {
    const { sql: updateSql } = pgMeta.roles.update({ id: 999999 }, { name: 'x' })
    await expect(db.executeQuery(updateSql)).rejects.toThrow(/Cannot find role with: 999999/)

    const { sql: removeSql } = pgMeta.roles.remove({ id: 999999 })
    await expect(db.executeQuery(removeSql)).rejects.toThrow(/Cannot find role with: 999999/)
  } finally {
    await db.cleanup()
  }
})
