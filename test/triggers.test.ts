import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/triggers', () => {
  test('should list triggers', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/triggers',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list triggers with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/triggers?include_system_schemas=true&limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent trigger', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/triggers/non-existent-trigger',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('should create trigger, retrieve, update, delete', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/triggers',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_trigger1',
        table: 'users_audit',
        function_name: 'audit_action',
        activation: 'AFTER',
        events: ['UPDATE'],
      },
    })
    expect(response.statusCode).toBe(200)
    const responseData = response.json()
    expect(responseData).toMatchObject({
      activation: 'AFTER',
      condition: null,
      enabled_mode: 'ORIGIN',
      events: ['UPDATE'],
      function_args: [],
      function_name: 'audit_action',
      function_schema: 'public',
      id: expect.any(Number),
      name: 'test_trigger1',
      orientation: 'STATEMENT',
      schema: 'public',
      table: 'users_audit',
      table_id: expect.any(Number),
    })

    const { id } = responseData

    const retrieveResponse = await app.inject({
      method: 'GET',
      url: `/triggers/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(retrieveResponse.statusCode).toBe(200)
    const retrieveData = retrieveResponse.json()
    expect(retrieveData).toMatchObject({
      activation: 'AFTER',
      condition: null,
      enabled_mode: 'ORIGIN',
      events: ['UPDATE'],
      function_args: [],
      function_name: 'audit_action',
      function_schema: 'public',
      id: expect.any(Number),
      name: 'test_trigger1',
      orientation: 'STATEMENT',
      schema: 'public',
      table: 'users_audit',
      table_id: expect.any(Number),
    })

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/triggers/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_trigger1_updated',
        enabled_mode: 'DISABLED',
      },
    })
    expect(updateResponse.statusCode).toBe(200)
    const updateData = updateResponse.json()
    expect(updateData).toMatchObject({
      activation: 'AFTER',
      condition: null,
      enabled_mode: 'DISABLED',
      events: ['UPDATE'],
      function_args: [],
      function_name: 'audit_action',
      function_schema: 'public',
      id: expect.any(Number),
      name: 'test_trigger1_updated',
      orientation: 'STATEMENT',
      schema: 'public',
      table: 'users_audit',
      table_id: expect.any(Number),
    })

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/triggers/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(deleteResponse.statusCode).toBe(200)
    const deleteData = deleteResponse.json()
    expect(deleteData).toMatchObject({
      activation: 'AFTER',
      condition: null,
      enabled_mode: 'DISABLED',
      events: ['UPDATE'],
      function_args: [],
      function_name: 'audit_action',
      function_schema: 'public',
      id: expect.any(Number),
      name: 'test_trigger1_updated',
      orientation: 'STATEMENT',
      schema: 'public',
      table: 'users_audit',
      table_id: expect.any(Number),
    })
  })

  test('should return 400 for invalid payload', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/triggers',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_trigger_invalid',
        table: 'non_existent_table',
        function_name: 'audit_action',
        activation: 'AFTER',
        events: ['UPDATE'],
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "error": "relation "public.non_existent_table" does not exist",
      }
    `)
  })
})
