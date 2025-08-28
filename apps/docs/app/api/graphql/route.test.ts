import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

describe('/api/graphql basic error statuses', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should return error if request body is not valid JSON', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: 'not json',
    })

    const response = await POST(request)
    const json = await response.json()
    expect(json.errors[0].message).toBe('Invalid request: Request body must be valid JSON')
  })

  it('should return error if request body is missing required fields', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ variables: {} }),
    })

    const response = await POST(request)
    const json = await response.json()
    expect(json.errors[0].message).toContain(
      'Invalid request: Request body must be valid GraphQL request object'
    )
  })

  it('should return error if query is not a string', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: 123 }),
    })

    const response = await POST(request)
    const json = await response.json()
    expect(json.errors[0].message).toContain(
      'Invalid request: Request body must be valid GraphQL request object'
    )
  })

  it('should return error for internal server errors', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: 'query { hello }' }),
    })

    vi.spyOn(request, 'json').mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const response = await POST(request)
    const json = await response.json()
    expect(json.errors[0].message).toBe('Internal Server Error')
  })
})

describe('/api/graphql schema snapshot', () => {
  it('should match snapshot', async () => {
    const schemaQuery = `
        query {
          schema
        }
      `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: schemaQuery }),
    })

    const response = await POST(request)
    const json = await response.json()
    expect(json.errors).toBeUndefined()

    const {
      data: { schema },
    } = json
    expect(schema).toMatchSnapshot()
  })
})
