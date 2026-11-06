import { describe, expect, it } from 'vitest'

const GRAPHQL_URL = 'https://supabase.com/docs/api/graphql'
// For dev testing: comment out above and uncomment below
// const GRAPHQL_URL = 'http://localhost:3001/docs/api/graphql'

describe('prod smoke test: graphql: schema', () => {
  it('schema query returns non-empty string', async () => {
    const query = `
        query SchemaQuery {
          schema
        }
      `
    const result = await fetch(GRAPHQL_URL, {
      method: 'POST',
      body: JSON.stringify({
        query,
      }),
    })

    expect(result.status).toBe(200)
    const { data, errors } = await result.json()
    expect(errors).toBeUndefined()

    const { schema } = data
    expect(schema).toBeDefined()
    expect(typeof schema).toBe('string')
    expect(schema.length).toBeGreaterThan(0)
  })
})
