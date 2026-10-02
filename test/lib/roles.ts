import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('list', async () => {
  const res = await pgMeta.roles.list()

  let role = res.data?.find(({ name }) => name === 'postgres')

  expect(role).toMatchInlineSnapshot(
    { active_connections: expect.any(Number), id: expect.any(Number) },
    `
    {
      "active_connections": Any<Number>,
      "can_bypass_rls": true,
      "can_create_db": true,
      "can_create_role": true,
      "can_login": true,
      "config": null,
      "connection_limit": 100,
      "id": Any<Number>,
      "inherit_role": true,
      "is_replication_role": true,
      "is_superuser": true,
      "name": "postgres",
      "password": "********",
      "valid_until": null,
    }
  `
  )

  // pg_monitor is a predefined role. `includeDefaultRoles` defaults to false,
  // so it shouldn't be included in the result.
  role = res.data?.find(({ name }) => name === 'pg_monitor')

  expect(role).toMatchInlineSnapshot(`undefined`)
})

test('list w/ default roles', async () => {
  const res = await pgMeta.roles.list({ includeDefaultRoles: true })

  const role = res.data?.find(({ name }) => name === 'pg_monitor')

  expect(role).toMatchInlineSnapshot(
    {
      active_connections: expect.any(Number),
      id: expect.any(Number),
    },
    `
    {
      "active_connections": Any<Number>,
      "can_bypass_rls": false,
      "can_create_db": false,
      "can_create_role": false,
      "can_login": false,
      "config": null,
      "connection_limit": 100,
      "id": Any<Number>,
      "inherit_role": true,
      "is_replication_role": false,
      "is_superuser": false,
      "name": "pg_monitor",
      "password": "********",
      "valid_until": null,
    }
  `
  )
})

test('retrieve, create, update, delete', async () => {
  let res = await pgMeta.roles.create({
    name: 'r',
    is_superuser: true,
    can_create_db: true,
    can_create_role: true,
    inherit_role: false,
    can_login: true,
    is_replication_role: true,
    can_bypass_rls: true,
    connection_limit: 100,
    valid_until: '2020-01-01T00:00:00.000Z',
    config: { search_path: 'extension, public' },
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "active_connections": 0,
        "can_bypass_rls": true,
        "can_create_db": true,
        "can_create_role": true,
        "can_login": true,
        "config": {
          "search_path": "extension, public",
        },
        "connection_limit": 100,
        "id": Any<Number>,
        "inherit_role": false,
        "is_replication_role": true,
        "is_superuser": true,
        "name": "r",
        "password": "********",
        "valid_until": "2020-01-01 00:00:00+00",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.roles.retrieve({ id: res.data!.id })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "active_connections": 0,
        "can_bypass_rls": true,
        "can_create_db": true,
        "can_create_role": true,
        "can_login": true,
        "config": {
          "search_path": "extension, public",
        },
        "connection_limit": 100,
        "id": Any<Number>,
        "inherit_role": false,
        "is_replication_role": true,
        "is_superuser": true,
        "name": "r",
        "password": "********",
        "valid_until": "2020-01-01 00:00:00+00",
      },
      "error": null,
    }
  `
  )
  await pgMeta.roles.remove(res.data!.id)
  res = await pgMeta.roles.create({
    name: 'r',
  })
  res = await pgMeta.roles.update(res.data!.id, {
    name: 'rr',
    is_superuser: true,
    can_create_db: true,
    can_create_role: true,
    inherit_role: false,
    can_login: true,
    is_replication_role: true,
    can_bypass_rls: true,
    connection_limit: 100,
    valid_until: '2020-01-01T00:00:00.000Z',
    config: [
      {
        op: 'replace',
        path: 'search_path',
        value: 'public',
      },
      {
        op: 'add',
        path: 'log_statement',
        value: 'all',
      },
    ],
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "active_connections": 0,
        "can_bypass_rls": true,
        "can_create_db": true,
        "can_create_role": true,
        "can_login": true,
        "config": {
          "log_statement": "all",
          "search_path": "public",
        },
        "connection_limit": 100,
        "id": Any<Number>,
        "inherit_role": false,
        "is_replication_role": true,
        "is_superuser": true,
        "name": "rr",
        "password": "********",
        "valid_until": "2020-01-01 00:00:00+00",
      },
      "error": null,
    }
  `
  )
  // Test remove config
  res = await pgMeta.roles.update(res.data!.id, {
    config: [
      {
        op: 'remove',
        path: 'log_statement',
      },
    ],
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "active_connections": 0,
        "can_bypass_rls": true,
        "can_create_db": true,
        "can_create_role": true,
        "can_login": true,
        "config": {
          "search_path": "public",
        },
        "connection_limit": 100,
        "id": Any<Number>,
        "inherit_role": false,
        "is_replication_role": true,
        "is_superuser": true,
        "name": "rr",
        "password": "********",
        "valid_until": "2020-01-01 00:00:00+00",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.roles.remove(res.data!.id)
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "active_connections": 0,
        "can_bypass_rls": true,
        "can_create_db": true,
        "can_create_role": true,
        "can_login": true,
        "config": {
          "search_path": "public",
        },
        "connection_limit": 100,
        "id": Any<Number>,
        "inherit_role": false,
        "is_replication_role": true,
        "is_superuser": true,
        "name": "rr",
        "password": "********",
        "valid_until": "2020-01-01 00:00:00+00",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.roles.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a role with ID \d+$/),
    },
  })
})
