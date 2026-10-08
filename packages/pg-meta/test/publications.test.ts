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
const cleanNondet = (res: any) => {
  if (!res.data?.tables) return res
  const tables = res.data.tables.map(({ id, ...rest }: any) => rest)
  return { ...res, data: { ...res.data, tables } }
}

withTestDatabase('retrieve, create, update, delete', async ({ executeQuery }) => {
  // Create publication
  const { sql: createSql } = pgMeta.publications.create({
    name: 'a',
    publish_insert: true,
    publish_update: true,
    publish_delete: true,
    publish_truncate: false,
    tables: ['users'],
  })
  await executeQuery(createSql)

  // Retrieve publication
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'a' })
  const res = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(cleanNondet({ data: res })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "a",
        "owner": "postgres",
        "publish_delete": true,
        "publish_insert": true,
        "publish_truncate": false,
        "publish_update": true,
        "tables": [
          {
            "name": "users",
            "schema": "public",
          },
        ],
      },
    }
  `
  )

  // Update publication
  const { sql: updateSql } = pgMeta.publications.update(res!.id, {
    name: 'b',
    publish_insert: false,
    tables: [],
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveUpdatedSql, zod: retrieveUpdatedZod } = pgMeta.publications.retrieve({
    name: 'b',
  })
  const updatedRes = retrieveUpdatedZod.parse((await executeQuery(retrieveUpdatedSql))[0])
  expect(cleanNondet({ data: updatedRes })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "b",
        "owner": "postgres",
        "publish_delete": true,
        "publish_insert": false,
        "publish_truncate": false,
        "publish_update": true,
        "tables": [],
      },
    }
  `
  )

  // Remove publication
  const { sql: removeSql } = pgMeta.publications.remove(updatedRes!)
  await executeQuery(removeSql)

  // Verify removal
  const { sql: verifyRemoveSql } = pgMeta.publications.retrieve({ id: updatedRes!.id })
  const finalRes = await executeQuery(verifyRemoveSql)
  expect(finalRes).toHaveLength(0)
})

withTestDatabase('tables with uppercase', async ({ executeQuery }) => {
  // Create table with uppercase name
  await executeQuery(`
    CREATE TABLE public."T" (
      id SERIAL PRIMARY KEY
    );
  `)

  // Create publication
  const { sql: createSql } = pgMeta.publications.create({
    name: 'pub',
    tables: ['T'],
  })
  await executeQuery(createSql)

  // Verify creation
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'pub' })
  let res = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(cleanNondet({ data: res })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "pub",
        "owner": "postgres",
        "publish_delete": false,
        "publish_insert": false,
        "publish_truncate": false,
        "publish_update": false,
        "tables": [
          {
            "name": "T",
            "schema": "public",
          },
        ],
      },
    }
  `
  )

  // Update publication
  const { sql: updateSql } = pgMeta.publications.update(res!.id, {
    tables: ['T'],
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveUpdatedSql, zod: retrieveUpdatedZod } = pgMeta.publications.retrieve({
    name: 'pub',
  })
  res = retrieveUpdatedZod.parse((await executeQuery(retrieveUpdatedSql))[0])
  expect(cleanNondet({ data: res })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "pub",
        "owner": "postgres",
        "publish_delete": false,
        "publish_insert": false,
        "publish_truncate": false,
        "publish_update": false,
        "tables": [
          {
            "name": "T",
            "schema": "public",
          },
        ],
      },
    }
  `
  )

  // Remove publication
  const { sql: removeSql } = pgMeta.publications.remove(res!)
  await executeQuery(removeSql)
})

withTestDatabase('FOR ALL TABLES', async ({ executeQuery }) => {
  // Create publication
  const { sql: createSql } = pgMeta.publications.create({
    name: 'for_all',
    publish_insert: true,
    publish_update: true,
    publish_delete: true,
    publish_truncate: false,
  })
  await executeQuery(createSql)

  // Retrieve and verify
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'for_all' })
  const res = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(cleanNondet({ data: res })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "for_all",
        "owner": "postgres",
        "publish_delete": true,
        "publish_insert": true,
        "publish_truncate": false,
        "publish_update": true,
        "tables": null,
      },
    }
  `
  )

  // Remove publication
  const { sql: removeSql } = pgMeta.publications.remove(res!)
  await executeQuery(removeSql)
})

withTestDatabase('update no tables -> all tables', async ({ executeQuery }) => {
  // Create publication
  const { sql: createSql } = pgMeta.publications.create({
    name: 'pub',
    tables: [],
  })
  await executeQuery(createSql)

  // Retrieve created publication
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'pub' })
  const res = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Update publication
  const { sql: updateSql } = pgMeta.publications.update(res!.id, {
    tables: null,
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: verifyRetrieveSql, zod: verifyRetrieveZod } = pgMeta.publications.retrieve({
    name: 'pub',
  })
  const updatedRes = verifyRetrieveZod.parse((await executeQuery(verifyRetrieveSql))[0])
  expect(cleanNondet({ data: updatedRes })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "pub",
        "owner": "postgres",
        "publish_delete": false,
        "publish_insert": false,
        "publish_truncate": false,
        "publish_update": false,
        "tables": null,
      },
    }
  `
  )

  // Remove publication
  const { sql: removeSql } = pgMeta.publications.remove(updatedRes!)
  await executeQuery(removeSql)
})

withTestDatabase('update all tables -> no tables', async ({ executeQuery }) => {
  // Create publication
  const { sql: createSql } = pgMeta.publications.create({
    name: 'pub',
    tables: null,
  })
  await executeQuery(createSql)

  // Retrieve created publication
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'pub' })
  const res = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Update publication
  const { sql: updateSql } = pgMeta.publications.update(res!.id, {
    tables: [],
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: verifyRetrieveSql, zod: verifyRetrieveZod } = pgMeta.publications.retrieve({
    name: 'pub',
  })
  const updatedRes = verifyRetrieveZod.parse((await executeQuery(verifyRetrieveSql))[0])
  expect(cleanNondet({ data: updatedRes })).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "pub",
        "owner": "postgres",
        "publish_delete": false,
        "publish_insert": false,
        "publish_truncate": false,
        "publish_update": false,
        "tables": [],
      },
    }
  `
  )

  // Remove publication
  const { sql: removeSql } = pgMeta.publications.remove(updatedRes!)
  await executeQuery(removeSql)
})

const publicationTableNames = async (
  executeQuery: <T = any>(query: string) => Promise<T>,
  name: string
) => {
  const { sql, zod } = pgMeta.publications.retrieve({ name })
  const res = zod.parse((await executeQuery(sql))[0])!
  return (res.tables ?? []).map((t) => `${t.schema}.${t.name}`).sort()
}

withTestDatabase('update replaces the published tables', async ({ executeQuery }) => {
  await executeQuery(pgMeta.publications.create({ name: 'pub', tables: ['users', 'todos'] }).sql)
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'pub' })
  const { id } = retrieveZod.parse((await executeQuery(retrieveSql))[0])!
  expect(await publicationTableNames(executeQuery, 'pub')).toEqual(['public.todos', 'public.users'])

  // A different list: removes users, keeps todos, adds memes.
  await executeQuery(
    pgMeta.publications.update(id, { tables: ['public.todos', 'public.memes'] }).sql
  )
  expect(await publicationTableNames(executeQuery, 'pub')).toEqual(['public.memes', 'public.todos'])

  // Bare table names resolve through the search path.
  await executeQuery(pgMeta.publications.update(id, { tables: ['users'] }).sql)
  expect(await publicationTableNames(executeQuery, 'pub')).toEqual(['public.users'])

  // An empty list clears the publication.
  await executeQuery(pgMeta.publications.update(id, { tables: [] }).sql)
  expect(await publicationTableNames(executeQuery, 'pub')).toEqual([])
})

withTestDatabase(
  'update without tables leaves the published tables alone',
  async ({ executeQuery }) => {
    await executeQuery(pgMeta.publications.create({ name: 'pub', tables: ['users', 'todos'] }).sql)
    const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'pub' })
    const { id } = retrieveZod.parse((await executeQuery(retrieveSql))[0])!

    await executeQuery(
      pgMeta.publications.update(id, { name: 'pub_renamed', publish_insert: true }).sql
    )
    expect(await publicationTableNames(executeQuery, 'pub_renamed')).toEqual([
      'public.todos',
      'public.users',
    ])
  }
)

withTestDatabase('update from a table list to all tables and back', async ({ executeQuery }) => {
  await executeQuery(pgMeta.publications.create({ name: 'pub', tables: ['users'] }).sql)
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.publications.retrieve({ name: 'pub' })
  const { id } = retrieveZod.parse((await executeQuery(retrieveSql))[0])!

  await executeQuery(pgMeta.publications.update(id, { tables: null }).sql)
  const allTables = retrieveZod.parse((await executeQuery(retrieveSql))[0])!
  expect(allTables.tables).toBeNull()

  // The publication was recreated, so its id changed.
  await executeQuery(pgMeta.publications.update(allTables.id, { tables: ['todos'] }).sql)
  expect(await publicationTableNames(executeQuery, 'pub')).toEqual(['public.todos'])
})
