import { expect, test } from 'vitest'
import { app } from './utils'

const cleanNondetFromBody = <T>(x: T) => {
  const cleanNondet = ({ id, columns, ...rest }: any) => {
    const cleaned = rest
    if (columns) {
      cleaned.columns = columns.map(({ id, table_id, ...rest }: any) => rest)
    }
    return cleaned
  }

  return (Array.isArray(x) ? x.map(cleanNondet) : cleanNondet(x)) as T
}

test('materialized views', async () => {
  const { body } = await app.inject({ method: 'GET', path: '/materialized-views' })
  expect(cleanNondetFromBody(JSON.parse(body))).toMatchInlineSnapshot(`
    [
      {
        "comment": null,
        "is_populated": true,
        "name": "todos_matview",
        "schema": "public",
      },
    ]
  `)
})

test('materialized views with columns', async () => {
  const { body } = await app.inject({
    method: 'GET',
    path: '/materialized-views',
    query: { include_columns: 'true' },
  })
  expect(cleanNondetFromBody(JSON.parse(body))).toMatchInlineSnapshot(`
    [
      {
        "columns": [
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": false,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "todos_matview",
          },
          {
            "check": null,
            "comment": null,
            "data_type": "text",
            "default_value": null,
            "enums": [],
            "format": "text",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": false,
            "name": "details",
            "ordinal_position": 2,
            "schema": "public",
            "table": "todos_matview",
          },
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": false,
            "name": "user-id",
            "ordinal_position": 3,
            "schema": "public",
            "table": "todos_matview",
          },
        ],
        "comment": null,
        "is_populated": true,
        "name": "todos_matview",
        "schema": "public",
      },
    ]
  `)
})
