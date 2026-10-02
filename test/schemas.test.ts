import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/schemas', () => {
  test('should list schemas', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/schemas',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list schemas with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/schemas?include_system_schemas=true&limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent schema', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/schemas/non-existent-schema',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('should create schema, retrieve, update, delete', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/schemas',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_schema',
      },
    })
    expect(response.statusCode).toBe(200)
    const responseData = response.json()
    expect(responseData).toMatchObject({
      id: expect.any(Number),
      name: 'test_schema',
      owner: 'postgres',
    })

    const { id } = responseData

    const retrieveResponse = await app.inject({
      method: 'GET',
      url: `/schemas/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(retrieveResponse.statusCode).toBe(200)
    const retrieveData = retrieveResponse.json()
    expect(retrieveData).toMatchObject({
      id: expect.any(Number),
      name: 'test_schema',
      owner: 'postgres',
    })

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/schemas/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_schema_updated',
      },
    })
    expect(updateResponse.statusCode).toBe(200)
    const updateData = updateResponse.json()
    expect(updateData).toMatchObject({
      id: expect.any(Number),
      name: 'test_schema_updated',
      owner: 'postgres',
    })

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/schemas/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(deleteResponse.statusCode).toBe(200)
    const deleteData = deleteResponse.json()
    expect(deleteData).toMatchObject({
      id: expect.any(Number),
      name: 'test_schema_updated',
      owner: 'postgres',
    })
  })

  test('should return 400 for invalid payload', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/schemas',
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
        "error": "unacceptable schema name "pg_"",
      }
    `)
  })
})
