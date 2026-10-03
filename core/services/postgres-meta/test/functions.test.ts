import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/functions', () => {
  test('should list functions', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/functions',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list functions with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/functions?include_system_schemas=true&limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent function', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/functions/non-existent-function',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('should create function, retrieve, update, delete', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/functions',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_function',
        schema: 'public',
        language: 'plpgsql',
        definition: 'BEGIN RETURN 42; END;',
        return_type: 'integer',
      },
    })
    expect(response.statusCode).toBe(200)
    const responseData = response.json()
    expect(responseData).toMatchObject({
      args: [],
      argument_types: '',
      behavior: 'VOLATILE',
      complete_statement: expect.stringContaining(
        'CREATE OR REPLACE FUNCTION public.test_function()'
      ),
      config_params: null,
      definition: 'BEGIN RETURN 42; END;',
      id: expect.any(Number),
      identity_argument_types: '',
      is_set_returning_function: false,
      language: 'plpgsql',
      name: 'test_function',
      return_type: 'integer',
      return_type_id: 23,
      return_type_relation_id: null,
      schema: 'public',
      security_definer: false,
    })

    const { id } = responseData

    const retrieveResponse = await app.inject({
      method: 'GET',
      url: `/functions/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(retrieveResponse.statusCode).toBe(200)
    const retrieveData = retrieveResponse.json()
    expect(retrieveData).toMatchObject({
      args: [],
      argument_types: '',
      behavior: 'VOLATILE',
      complete_statement: expect.stringContaining(
        'CREATE OR REPLACE FUNCTION public.test_function()'
      ),
      config_params: null,
      definition: 'BEGIN RETURN 42; END;',
      id: expect.any(Number),
      identity_argument_types: '',
      is_set_returning_function: false,
      language: 'plpgsql',
      name: 'test_function',
      return_type: 'integer',
      return_type_id: 23,
      return_type_relation_id: null,
      schema: 'public',
      security_definer: false,
    })

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/functions/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_function',
        schema: 'public',
        language: 'plpgsql',
        definition: 'BEGIN RETURN 50; END;',
        return_type: 'integer',
      },
    })
    expect(updateResponse.statusCode).toBe(200)
    const updateData = updateResponse.json()
    expect(updateData).toMatchObject({
      args: [],
      argument_types: '',
      behavior: 'VOLATILE',
      complete_statement: expect.stringContaining(
        'CREATE OR REPLACE FUNCTION public.test_function()'
      ),
      config_params: null,
      definition: 'BEGIN RETURN 50; END;',
      id: expect.any(Number),
      identity_argument_types: '',
      is_set_returning_function: false,
      language: 'plpgsql',
      name: 'test_function',
      return_type: 'integer',
      return_type_id: 23,
      return_type_relation_id: null,
      schema: 'public',
      security_definer: false,
    })

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/functions/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(deleteResponse.statusCode).toBe(200)
    const deleteData = deleteResponse.json()
    expect(deleteData).toMatchObject({
      args: [],
      argument_types: '',
      behavior: 'VOLATILE',
      complete_statement: expect.stringContaining(
        'CREATE OR REPLACE FUNCTION public.test_function()'
      ),
      config_params: null,
      definition: 'BEGIN RETURN 50; END;',
      id: expect.any(Number),
      identity_argument_types: '',
      is_set_returning_function: false,
      language: 'plpgsql',
      name: 'test_function',
      return_type: 'integer',
      return_type_id: 23,
      return_type_relation_id: null,
      schema: 'public',
      security_definer: false,
    })
  })

  test('should return 400 for invalid payload', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/functions',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_function12',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "error": "syntax error at or near "NULL"",
      }
    `)
  })
})
