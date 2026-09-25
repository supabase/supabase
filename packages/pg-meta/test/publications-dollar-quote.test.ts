import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

// The update() DO block interpolates user values via literal() into its body.
// literal() protects against quote-breaking but not against a value containing
// $$ terminating the fixed $$ dollar-quote of the block itself.
test('updating a publication with a name containing dollar quotes succeeds', async () => {
  const db = await createTestDatabase()
  try {
    await db.executeQuery(`create table public.pub_dollar_probe (id integer);`)
    const { sql: createSql } = pgMeta.publications.create({
      name: 'pub_dollar_probe',
      tables: ['public.pub_dollar_probe'],
    })
    await db.executeQuery(createSql)

    const retrieved = await db.executeQuery(
      `select oid as id from pg_publication where pubname = 'pub_dollar_probe';`
    )
    const id = (retrieved as { id: number }[])[0].id

    const { sql: updateSql } = pgMeta.publications.update(id, {
      name: 'pub_$$_renamed',
      publish_insert: true,
      tables: null,
    })
    await db.executeQuery(updateSql)

    const renamed = await db.executeQuery(
      `select count(*)::int as n from pg_publication where pubname = 'pub_$$_renamed';`
    )
    expect(renamed).toEqual([{ n: 1 }])
  } finally {
    await db
      .executeQuery(
        `drop publication if exists pub_$$_renamed; drop table if exists public.pub_dollar_probe;`
      )
      .catch(() => undefined)
    await db.cleanup()
  }
})
