import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/publications', () => {
  test('should list publications', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/publications',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list publications with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/publications?limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent publication', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/publications/non-existent-publication',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('should create publication, retrieve, update, delete', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/publications',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_publication',
        publish_insert: true,
        publish_update: true,
        publish_delete: true,
        publish_truncate: false,
        tables: ['users'],
      },
    })
    expect(response.statusCode).toBe(200)
    const responseData = response.json()
    expect(responseData).toMatchObject({
      id: expect.any(Number),
      name: 'test_publication',
      owner: 'postgres',
      publish_delete: true,
      publish_insert: true,
      publish_truncate: false,
      publish_update: true,
      tables: [
        {
          id: expect.any(Number),
          name: 'users',
          schema: 'public',
        },
      ],
    })

    const { id } = responseData

    const retrieveResponse = await app.inject({
      method: 'GET',
      url: `/publications/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(retrieveResponse.statusCode).toBe(200)
    const retrieveData = retrieveResponse.json()
    expect(retrieveData).toMatchObject({
      id: expect.any(Number),
      name: 'test_publication',
      owner: 'postgres',
      publish_delete: true,
      publish_insert: true,
      publish_truncate: false,
      publish_update: true,
      tables: [
        {
          id: expect.any(Number),
          name: 'users',
          schema: 'public',
        },
      ],
    })

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/publications/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        publish_delete: false,
      },
    })
    expect(updateResponse.statusCode).toBe(200)
    const updateData = updateResponse.json()
    expect(updateData).toMatchObject({
      id: expect.any(Number),
      name: 'test_publication',
      owner: 'postgres',
      publish_delete: false,
      publish_insert: true,
      publish_truncate: false,
      publish_update: true,
      tables: [
        {
          id: expect.any(Number),
          name: 'users',
          schema: 'public',
        },
      ],
    })

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/publications/${id}`,
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(deleteResponse.statusCode).toBe(200)
    const deleteData = deleteResponse.json()
    expect(deleteData).toMatchObject({
      id: expect.any(Number),
      name: 'test_publication',
      owner: 'postgres',
      publish_delete: false,
      publish_insert: true,
      publish_truncate: false,
      publish_update: true,
      tables: [
        {
          id: expect.any(Number),
          name: 'users',
          schema: 'public',
        },
      ],
    })
  })

  test('should return 400 for invalid payload', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/publications',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: {
        name: 'test_publication',
        tables: ['non_existent_table'],
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "error": "relation "non_existent_table" does not exist",
      }
    `)
  })
})
