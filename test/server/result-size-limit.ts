import { expect, test, beforeAll, afterAll, describe } from 'vitest'
import { app } from './utils'
import { pgMeta } from '../lib/utils'

describe('test max-result-size limit', () => {
  // Create a table with large data for testing
  beforeAll(async () => {
    // Create a table with a large text column
    await pgMeta.query(`
      CREATE TABLE large_data (
        id SERIAL PRIMARY KEY,
        data TEXT
      );
    `)
    await pgMeta.query(`
      CREATE TABLE small_data (
        id SERIAL PRIMARY KEY,
        data TEXT
      );
    `)

    // Insert data that will exceed our limit in tests it's set around ~20MB
    await pgMeta.query(`
      INSERT INTO large_data (data)
      SELECT repeat('x', 1024 * 1024) -- 1MB of data per row
      FROM generate_series(1, 50);
    `)
    await pgMeta.query(`
      INSERT INTO small_data (data)
      SELECT repeat('x', 10 * 1024) -- 10KB per row
      FROM generate_series(1, 50);
    `)
  })

  afterAll(async () => {
    // Clean up the test table
    await pgMeta.query('DROP TABLE large_data;')
    await pgMeta.query('DROP TABLE small_data;')
  })

  test('query exceeding result size limit', async () => {
    // Set a small maxResultSize (50MB)
    const res = await app.inject({
      method: 'POST',
      path: '/query',
      payload: { query: 'SELECT * FROM large_data;' },
    })

    // Check that we get the proper error response
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({
      error: expect.stringContaining('Query result size'),
      code: 'RESULT_SIZE_EXCEEDED',
      resultSize: expect.any(Number),
      maxResultSize: 20 * 1024 * 1024,
    })

    // Verify that subsequent queries still work and the server isn't killed
    const nextRes = await app.inject({
      method: 'POST',
      path: '/query',
      payload: { query: 'SELECT * FROM small_data;' },
    })

    expect(nextRes.statusCode).toBe(200)
    // Should have retrieve the 50 rows as expected
    expect(nextRes.json()).toHaveLength(50)
  })
})

describe('test js parser error max result', () => {
  // Create a table with large data for testing
  beforeAll(async () => {
    // Create a table with a large text column
    await pgMeta.query(`
      CREATE TABLE very_large_data (
        id SERIAL PRIMARY KEY,
        data TEXT
      );
    `)

    // Insert data that will exceed our limit in tests it's set around ~20MB
    await pgMeta.query(`
      INSERT INTO very_large_data (data)
      VALUES (repeat('x', 710 * 1024 * 1024)) -- 700+MB string will raise a JS exception at parse time
    `)
  })

  afterAll(async () => {
    // Clean up the test table
    await pgMeta.query('DROP TABLE very_large_data;')
  })

  test(
    'should not kill the server on underlying parser error',
    async () => {
      // Set a small maxResultSize (50MB)
      const res = await app.inject({
        method: 'POST',
        path: '/query',
        payload: { query: 'SELECT * FROM very_large_data;' },
      })

      // Check that we get the proper error response from the underlying parser
      expect(res.json()).toMatchInlineSnapshot(`
      {
        "error": "exception received while handling packet: Error: Cannot create a string longer than 0x1fffffe8 characters
      ",
        "formattedError": "exception received while handling packet: Error: Cannot create a string longer than 0x1fffffe8 characters
      ",
        "length": 744488975,
        "message": "exception received while handling packet: Error: Cannot create a string longer than 0x1fffffe8 characters",
        "name": "error",
      }
    `)

      // Verify that subsequent queries still work and the server isn't killed
      const nextRes = await app.inject({
        method: 'POST',
        path: '/query',
        payload: { query: 'SELECT * FROM todos;' },
      })
      expect(nextRes.json()).toMatchInlineSnapshot(`
      [
        {
          "details": "Star the repo",
          "id": 1,
          "user-id": 1,
        },
        {
          "details": "Watch the releases",
          "id": 2,
          "user-id": 2,
        },
      ]
    `)
    },
    { timeout: 20000 }
  )
})
