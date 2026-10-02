import { expect, test } from 'vitest'
import { pgMeta } from './utils'

const cleanNondetFromResponse = <T>(x: T) => {
  const { data, ...rest } = x as any

  const cleanNondetFromData = ({ id, columns, ...rest }: any) => {
    const cleaned = rest
    if (columns) {
      cleaned.columns = columns.map(({ id, table_id, ...rest }: any) => rest)
    }
    return cleaned
  }

  return {
    data: Array.isArray(data) ? data.map(cleanNondetFromData) : cleanNondetFromData(data),
    ...rest,
  } as T
}

test('list', async () => {
  const res = await pgMeta.foreignTables.list()
  expect(cleanNondetFromResponse(res).data?.find(({ name }) => name === 'foreign_table'))
    .toMatchInlineSnapshot(`
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
            "is_nullable": false,
            "is_unique": false,
            "is_updatable": true,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "foreign_table",
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
            "is_updatable": true,
            "name": "name",
            "ordinal_position": 2,
            "schema": "public",
            "table": "foreign_table",
          },
          {
            "check": null,
            "comment": null,
            "data_type": "USER-DEFINED",
            "default_value": null,
            "enums": [
              "ACTIVE",
              "INACTIVE",
            ],
            "format": "user_status",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "status",
            "ordinal_position": 3,
            "schema": "public",
            "table": "foreign_table",
          },
        ],
        "comment": null,
        "name": "foreign_table",
        "schema": "public",
      }
    `)
})

test('list without columns', async () => {
  const res = await pgMeta.foreignTables.list({ includeColumns: false })
  expect(cleanNondetFromResponse(res).data?.find(({ name }) => name === 'foreign_table'))
    .toMatchInlineSnapshot(`
    {
      "comment": null,
      "name": "foreign_table",
      "schema": "public",
    }
  `)
})

test('retrieve', async () => {
  const res = await pgMeta.foreignTables.retrieve({ schema: 'public', name: 'foreign_table' })
  expect(cleanNondetFromResponse(res)).toMatchInlineSnapshot(`
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
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": false,
            "is_unique": false,
            "is_updatable": true,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "foreign_table",
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
            "is_updatable": true,
            "name": "name",
            "ordinal_position": 2,
            "schema": "public",
            "table": "foreign_table",
          },
          {
            "check": null,
            "comment": null,
            "data_type": "USER-DEFINED",
            "default_value": null,
            "enums": [
              "ACTIVE",
              "INACTIVE",
            ],
            "format": "user_status",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "status",
            "ordinal_position": 3,
            "schema": "public",
            "table": "foreign_table",
          },
        ],
        "comment": null,
        "name": "foreign_table",
        "schema": "public",
      },
      "error": null,
    }
  `)
})
