import { expect, test, beforeAll, afterAll } from 'vitest'
import pgMeta from '../src/index'
import { createTestDatabase, cleanupRoot } from './db/utils'

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
      "id": Any<Number>,
      "name": "public",
      "owner": "postgres",
    }
    `
  )
})

// test('retrieve, create, update, delete', async () => {
//   // Create
//   let { sql } = await pgMeta.schemas.create({ name: 's' })
//   let res = await executeQuery(sql)
//   expect(res).toMatchInlineSnapshot(
//     { id: expect.any(Number) },
//     `
//     {
//       "id": Any<Number>,
//       "name": "s",
//       "owner": "postgres",
//     }
//     `
//   )

//   // Retrieve
//   const schemaId = res.id
//   ;({ sql } = await pgMeta.schemas.retrieve({ id: schemaId }))
//   res = await executeQuery(sql)
//   expect(res).toMatchInlineSnapshot(
//     { id: expect.any(Number) },
//     `
//     {
//       "id": Any<Number>,
//       "name": "s",
//       "owner": "postgres",
//     }
//     `
//   )

//   // Update
//   ;({ sql } = await pgMeta.schemas.update(schemaId, { name: 'ss', owner: 'postgres' }))
//   res = await executeQuery(sql)
//   expect(res).toMatchInlineSnapshot(
//     { id: expect.any(Number) },
//     `
//     {
//       "id": Any<Number>,
//       "name": "ss",
//       "owner": "postgres",
//     }
//     `
//   )

//   // Remove
//   ;({ sql } = await pgMeta.schemas.remove(schemaId))
//   res = await executeQuery(sql)
//   expect(res).toMatchInlineSnapshot(
//     { id: expect.any(Number) },
//     `
//     {
//       "id": Any<Number>,
//       "name": "ss",
//       "owner": "postgres",
//     }
//     `
//   )

//   // Verify deletion
//   ;({ sql } = await pgMeta.schemas.retrieve({ id: schemaId }))
//   res = await executeQuery(sql)
//   expect(res).toBeNull()
// })
