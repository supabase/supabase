import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'
import { TEST_CONNECTION_STRING } from './lib/utils.js'
import { pgTypeToTsType } from '@supabase/postgrest-typegen'

describe('server/routes/types', () => {
  test('should list types', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/types',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should list types with query parameters', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/types?include_system_schemas=true&limit=5&offset=0',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(response.body))).toBe(true)
    await app.close()
  })

  test('should return 404 for non-existent type', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/types/non-existent-type',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
    })
    expect(response.statusCode).toBe(404)
    await app.close()
  })

  test('nullable interval column maps to string | null', () => {
    const result = pgTypeToTsType({ name: 'public' } as any, 'interval', {
      types: [],
      schemas: [],
      tables: [],
      views: [],
    })

    expect(result).toBe('string')
  })
})
