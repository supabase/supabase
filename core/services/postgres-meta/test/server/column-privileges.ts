import { expect, test } from 'vitest'
import { PostgresColumnPrivileges } from '../../src/lib/types'
import { app } from './utils'

test('list column privileges', async () => {
  const res = await app.inject({ method: 'GET', path: '/column-privileges' })
  const column = res
    .json<PostgresColumnPrivileges[]>()
    .find(
      ({ relation_schema, relation_name, column_name }) =>
        relation_schema === 'public' && relation_name === 'todos' && column_name === 'id'
    )!
  // We don't guarantee order of privileges, but we want to keep the snapshots consistent.
  column.privileges.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  expect(column).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "id",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
      ],
      "relation_name": "todos",
      "relation_schema": "public",
    }
  `
  )
})

test('revoke & grant column privileges', async () => {
  let res = await app.inject({ method: 'GET', path: '/column-privileges' })
  const { column_id } = res
    .json<PostgresColumnPrivileges[]>()
    .find(
      ({ relation_schema, relation_name, column_name }) =>
        relation_schema === 'public' && relation_name === 'todos' && column_name === 'id'
    )!

  res = await app.inject({
    method: 'POST',
    path: '/query',
    payload: {
      query: `create role r;`,
    },
  })
  if (res.json().error) {
    throw new Error(res.payload)
  }

  res = await app.inject({
    method: 'POST',
    path: '/column-privileges',
    payload: [
      {
        column_id,
        grantee: 'r',
        privilege_type: 'ALL',
      },
    ],
  })
  let privs = res.json<PostgresColumnPrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "id",
      "privileges": [
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_name": "todos",
      "relation_schema": "public",
    }
  `
  )

  res = await app.inject({
    method: 'DELETE',
    path: '/column-privileges',
    payload: [
      {
        column_id,
        grantee: 'r',
        privilege_type: 'ALL',
      },
    ],
  })
  privs = res.json<PostgresColumnPrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "id",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_name": "todos",
      "relation_schema": "public",
    }
  `
  )

  res = await app.inject({
    method: 'POST',
    path: '/query',
    payload: {
      query: `drop role r;`,
    },
  })
  if (res.json().error) {
    throw new Error(res.payload)
  }
})

test('revoke & grant column privileges w/ quoted column name', async () => {
  let res = await app.inject({
    method: 'POST',
    path: '/query',
    payload: {
      query: `create role r; create table "t 1"("c 1" int8);`,
    },
  })
  if (res.json().error) {
    throw new Error(res.payload)
  }

  res = await app.inject({ method: 'GET', path: '/column-privileges' })
  const { column_id } = res
    .json<PostgresColumnPrivileges[]>()
    .find(({ relation_name, column_name }) => relation_name === 't 1' && column_name === 'c 1')!

  res = await app.inject({
    method: 'POST',
    path: '/column-privileges',
    payload: [
      {
        column_id,
        grantee: 'r',
        privilege_type: 'ALL',
      },
    ],
  })
  let privs = res.json<PostgresColumnPrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "c 1",
      "privileges": [
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_name": "t 1",
      "relation_schema": "public",
    }
  `
  )

  res = await app.inject({
    method: 'DELETE',
    path: '/column-privileges',
    payload: [
      {
        column_id,
        grantee: 'r',
        privilege_type: 'ALL',
      },
    ],
  })
  privs = res.json<PostgresColumnPrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { column_id: expect.stringMatching(/^\d+\.\d+$/) },
    `
    {
      "column_id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
      "column_name": "c 1",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "UPDATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "SELECT",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "REFERENCES",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "INSERT",
        },
      ],
      "relation_name": "t 1",
      "relation_schema": "public",
    }
  `
  )

  res = await app.inject({
    method: 'POST',
    path: '/query',
    payload: {
      query: `drop role r; drop table "t 1";`,
    },
  })
  if (res.json().error) {
    throw new Error(res.payload)
  }
})
