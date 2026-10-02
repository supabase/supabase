import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('list', async () => {
  const res = await pgMeta.views.list()
  expect(res.data?.find(({ name }) => name === 'todos_view')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "columns": [
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16424.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16424,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16424.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "details",
          "ordinal_position": 2,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16424,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16424.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "user-id",
          "ordinal_position": 3,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16424,
        },
      ],
      "comment": null,
      "id": Any<Number>,
      "is_updatable": true,
      "name": "todos_view",
      "schema": "public",
    }
  `
  )
})

test('list without columns', async () => {
  const res = await pgMeta.views.list({ includeColumns: false })
  expect(res.data?.find(({ name }) => name === 'todos_view')).toMatchInlineSnapshot(
    {
      id: expect.any(Number),
    },
    `
    {
      "comment": null,
      "id": Any<Number>,
      "is_updatable": true,
      "name": "todos_view",
      "schema": "public",
    }
  `
  )
})

test('retrieve', async () => {
  const res = await pgMeta.views.retrieve({ schema: 'public', name: 'todos_view' })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "columns": [
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "id": "16424.1",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "todos_view",
            "table_id": 16424,
          },
          {
            "check": null,
            "comment": null,
            "data_type": "text",
            "default_value": null,
            "enums": [],
            "format": "text",
            "id": "16424.2",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "details",
            "ordinal_position": 2,
            "schema": "public",
            "table": "todos_view",
            "table_id": 16424,
          },
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "id": "16424.3",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "user-id",
            "ordinal_position": 3,
            "schema": "public",
            "table": "todos_view",
            "table_id": 16424,
          },
        ],
        "comment": null,
        "id": Any<Number>,
        "is_updatable": true,
        "name": "todos_view",
        "schema": "public",
      },
      "error": null,
    }
  `
  )
})
