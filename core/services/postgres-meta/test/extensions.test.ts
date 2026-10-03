import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/extensions', () => {
  test('should list extensions', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/extensions',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list extensions with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/extensions?limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent extension', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/extensions/non-existent-extension',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('should create extension, retrieve, update, delete', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/extensions',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: { name: 'pgcrypto', version: '1.3' },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchInlineSnapshot(`
        {
          "comment": "cryptographic functions",
          "default_version": "1.3",
          "installed_version": "1.3",
          "name": "pgcrypto",
          "schema": "public",
        }
      `)

    const retrieveResponse = await app.inject({
      method: 'GET',
      url: '/extensions/pgcrypto',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(retrieveResponse.statusCode).toBe(200)
    expect(retrieveResponse.json()).toMatchInlineSnapshot(`
        {
          "comment": "cryptographic functions",
          "default_version": "1.3",
          "installed_version": "1.3",
          "name": "pgcrypto",
          "schema": "public",
        }
      `)

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/extensions/pgcrypto',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: { schema: 'public' },
    })
    expect(updateResponse.statusCode).toBe(200)
    expect(updateResponse.json()).toMatchInlineSnapshot(`
      {
        "comment": "cryptographic functions",
        "default_version": "1.3",
        "installed_version": "1.3",
        "name": "pgcrypto",
        "schema": "public",
      }
    `)

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/extensions/pgcrypto',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(deleteResponse.statusCode).toBe(200)
    expect(deleteResponse.json()).toMatchInlineSnapshot(`
      {
        "comment": "cryptographic functions",
        "default_version": "1.3",
        "installed_version": "1.3",
        "name": "pgcrypto",
        "schema": "public",
      }
    `)

    await app.close()
  })

  test('should return 400 for invalid extension name', async () => {
    const app = build()
    const response = await app.inject({
      method: 'POST',
      url: '/extensions',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      payload: { name: 'invalid-extension', version: '1.3' },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "error": "could not open extension control file "/usr/share/postgresql/14/extension/invalid-extension.control": No such file or directory",
      }
    `)
    await app.close()
  })
})
