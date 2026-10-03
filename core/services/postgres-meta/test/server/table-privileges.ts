import { expect, test } from 'vitest'
import { PostgresTablePrivileges } from '../../src/lib/types'
import { app } from './utils'

test('list table privileges', async () => {
  const res = await app.inject({ method: 'GET', path: '/table-privileges' })
  expect(
    res
      .json<PostgresTablePrivileges[]>()
      .find(({ schema, name }) => schema === 'public' && name === 'todos')
  ).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "todos",
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
          "privilege_type": "SELECT",
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
          "privilege_type": "DELETE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRUNCATE",
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
          "privilege_type": "TRIGGER",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "public",
    }
  `
  )
})

test('revoke & grant table privileges', async () => {
  let res = await app.inject({ method: 'GET', path: '/table-privileges' })
  const { relation_id } = res
    .json<PostgresTablePrivileges[]>()
    .find(({ schema, name }) => schema === 'public' && name === 'todos')!

  res = await app.inject({
    method: 'DELETE',
    path: '/table-privileges',
    payload: [
      {
        relation_id,
        grantee: 'postgres',
        privilege_type: 'ALL',
      },
    ],
  })
  let privs = res.json<PostgresTablePrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "todos",
      "privileges": [],
      "relation_id": Any<Number>,
      "schema": "public",
    }
  `
  )

  res = await app.inject({
    method: 'POST',
    path: '/table-privileges',
    payload: [
      {
        relation_id,
        grantee: 'postgres',
        privilege_type: 'ALL',
      },
    ],
  })
  privs = res.json<PostgresTablePrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "todos",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
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
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
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
          "privilege_type": "INSERT",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "public",
    }
  `
  )
})

test('revoke & grant table privileges w/ quoted table name', async () => {
  let res = await app.inject({
    method: 'POST',
    path: '/query',
    payload: {
      query: `create role r; create schema "s 1"; create table "s 1"."t 1"();`,
    },
  })
  if (res.json().error) {
    throw new Error(res.payload)
  }

  res = await app.inject({ method: 'GET', path: '/table-privileges' })
  const { relation_id } = res
    .json<PostgresTablePrivileges[]>()
    .find(({ schema, name }) => schema === 's 1' && name === 't 1')!

  res = await app.inject({
    method: 'POST',
    path: '/table-privileges',
    payload: [
      {
        relation_id,
        grantee: 'r',
        privilege_type: 'ALL',
      },
    ],
  })
  let privs = res.json<PostgresTablePrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "t 1",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
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
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
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
          "privilege_type": "INSERT",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
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
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "r",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
        },
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
          "privilege_type": "INSERT",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "s 1",
    }
  `
  )

  res = await app.inject({
    method: 'DELETE',
    path: '/table-privileges',
    payload: [
      {
        relation_id,
        grantee: 'r',
        privilege_type: 'ALL',
      },
    ],
  })
  privs = res.json<PostgresTablePrivileges[]>()
  expect(privs.length).toBe(1)
  expect(privs[0]).toMatchInlineSnapshot(
    { relation_id: expect.any(Number) },
    `
    {
      "kind": "table",
      "name": "t 1",
      "privileges": [
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "TRIGGER",
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
          "privilege_type": "TRUNCATE",
        },
        {
          "grantee": "postgres",
          "grantor": "postgres",
          "is_grantable": false,
          "privilege_type": "DELETE",
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
          "privilege_type": "INSERT",
        },
      ],
      "relation_id": Any<Number>,
      "schema": "s 1",
    }
  `
  )

  res = await app.inject({
    method: 'POST',
    path: '/query',
    payload: {
      query: `drop role r; drop schema "s 1" cascade;`,
    },
  })
  if (res.json().error) {
    throw new Error(res.payload)
  }
})
