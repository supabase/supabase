import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/roles', () => {
  test('should list roles', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/roles',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list roles with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/roles?limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent role', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/roles/non-existent-role',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('should create role, retrieve, update, delete', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/roles',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_role',
      },
    })
    expect(response.statusCode).toBe(200)
    const responseData = response.json()
    expect(responseData).toMatchObject({
      active_connections: 0,
      can_bypass_rls: false,
      can_create_db: false,
      can_create_role: false,
      can_login: false,
      config: null,
      connection_limit: 100,
      id: expect.any(Number),
      inherit_role: true,
      is_replication_role: false,
      is_superuser: false,
      name: 'test_role',
      password: '********',
      valid_until: null,
    })

    const { id } = responseData

    const retrieveResponse = await app.inject({
      method: 'GET',
      url: `/roles/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(retrieveResponse.statusCode).toBe(200)
    const retrieveData = retrieveResponse.json()
    expect(retrieveData).toMatchObject({
      active_connections: 0,
      can_bypass_rls: false,
      can_create_db: false,
      can_create_role: false,
      can_login: false,
      config: null,
      connection_limit: 100,
      id: expect.any(Number),
      inherit_role: true,
      is_replication_role: false,
      is_superuser: false,
      name: 'test_role',
      password: '********',
      valid_until: null,
    })

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/roles/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_role_updated',
      },
    })
    expect(updateResponse.statusCode).toBe(200)
    const updateData = updateResponse.json()
    expect(updateData).toMatchObject({
      active_connections: 0,
      can_bypass_rls: false,
      can_create_db: false,
      can_create_role: false,
      can_login: false,
      config: null,
      connection_limit: 100,
      id: expect.any(Number),
      inherit_role: true,
      is_replication_role: false,
      is_superuser: false,
      name: 'test_role_updated',
      password: '********',
      valid_until: null,
    })

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/roles/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(deleteResponse.statusCode).toBe(200)
    const deleteData = deleteResponse.json()
    expect(deleteData).toMatchObject({
      active_connections: 0,
      can_bypass_rls: false,
      can_create_db: false,
      can_create_role: false,
      can_login: false,
      config: null,
      connection_limit: 100,
      id: expect.any(Number),
      inherit_role: true,
      is_replication_role: false,
      is_superuser: false,
      name: 'test_role_updated',
      password: '********',
      valid_until: null,
    })
  })

  test('should return 400 for invalid payload', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/roles',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'pg_',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "error": "role name "pg_" is reserved",
      }
    `)
  })
})
