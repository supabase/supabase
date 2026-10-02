import { expect, test } from 'vitest'
import { pgMeta } from './utils'

const cleanNondet = (x: any) => {
  const {
    data: { tables, ...rest2 },
    ...rest1
  } = x

  return {
    data: {
      tables: tables?.map(({ id, ...rest }: any) => rest) ?? tables,
      ...rest2,
    },
    ...rest1,
  }
}

test('retrieve, create, update, delete', async () => {
  let res = await pgMeta.publications.create({
    name: 'a',
    publish_insert: true,
    publish_update: true,
    publish_delete: true,
    publish_truncate: false,
    tables: ['users'],
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  res = await pgMeta.publications.retrieve({ id: res.data!.id })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  res = await pgMeta.publications.update(res.data!.id, {
    name: 'b',
    publish_insert: false,
    tables: [],
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  res = await pgMeta.publications.remove(res.data!.id)
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  res = await pgMeta.publications.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a publication with ID \d+$/),
    },
  })
})

test('tables with uppercase', async () => {
  const {
    data: { id: testTableId },
  }: any = await pgMeta.tables.create({ name: 'T' })

  let res = await pgMeta.publications.create({
    name: 'pub',
    tables: ['T'],
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  res = await pgMeta.publications.update(res.data!.id, {
    tables: ['T'],
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  await pgMeta.publications.remove(res.data!.id)

  await pgMeta.tables.remove(testTableId)
})

test('FOR ALL TABLES', async () => {
  let res = await pgMeta.publications.create({
    name: 'for_all',
    publish_insert: true,
    publish_update: true,
    publish_delete: true,
    publish_truncate: false,
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  await pgMeta.publications.remove(res.data!.id)
})

test('update no tables -> all tables', async () => {
  const { data } = await pgMeta.publications.create({
    name: 'pub',
    tables: [],
  })
  const res = await pgMeta.publications.update(data!.id, { tables: null })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  await pgMeta.publications.remove(res.data!.id)
})

test('update all tables -> no tables', async () => {
  const { data } = await pgMeta.publications.create({
    name: 'pub',
    tables: null,
  })
  const res = await pgMeta.publications.update(data!.id, { tables: [] })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
      "error": null,
    }
  `
  )
  await pgMeta.publications.remove(res.data!.id)
})
