import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('list with system schemas', async () => {
  const res = await pgMeta.schemas.list({ includeSystemSchemas: true })
  expect(res.data?.find(({ name }) => name === 'pg_catalog')).toMatchInlineSnapshot(
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

test('list without system schemas', async () => {
  const res = await pgMeta.schemas.list({ includeSystemSchemas: false })
  expect(res.data?.find(({ name }) => name === 'pg_catalog')).toMatchInlineSnapshot(`undefined`)
  expect(res.data?.find(({ name }) => name === 'public')).toMatchInlineSnapshot(
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

test('retrieve, create, update, delete', async () => {
  let res = await pgMeta.schemas.create({ name: 's' })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "s",
        "owner": "postgres",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.schemas.retrieve({ id: res.data!.id })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "s",
        "owner": "postgres",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.schemas.update(res.data!.id, { name: 'ss', owner: 'postgres' })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "ss",
        "owner": "postgres",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.schemas.remove(res.data!.id)
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "id": Any<Number>,
        "name": "ss",
        "owner": "postgres",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.schemas.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a schema with ID \d+$/),
    },
  })
})
