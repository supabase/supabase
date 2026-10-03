import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'

describe('server/routes/views', () => {
  test('should list views', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/views',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list views with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/views?include_system_schemas=true&limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent view', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/views/1',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "error": "Cannot find a view with ID 1",
      }
    `)
    await app.close()
  })
})
