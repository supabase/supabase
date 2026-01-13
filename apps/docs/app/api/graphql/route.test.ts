import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/logger', async () => {
  const actual = await vi.importActual<typeof import('~/lib/logger')>('~/lib/logger')
  return {
    ...actual,
    sendToLogflare: vi.fn(),
  }
})

import { GET, POST } from './route'

describe('/api/graphql POST basic error statuses', () => {
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
      'Invalid request: GraphQL request payload must be valid GraphQL request object'
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
      'Invalid request: GraphQL request payload must be valid GraphQL request object'
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

describe('/api/graphql GET support', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('should return error if query parameter is missing', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'GET',
    })

    const response = await GET(request)
    const json = await response.json()
    expect(json.errors[0].message).toContain(
      'Invalid request: GraphQL request payload must be valid GraphQL request object'
    )
  })

  it('should return error if variables parameter is not valid JSON', async () => {
    const url = new URL('http://localhost/api/graphql')
    url.searchParams.set('query', '{ schema }')
    url.searchParams.set('variables', '{not json}')
    const request = new Request(url, {
      method: 'GET',
    })

    const response = await GET(request)
    const json = await response.json()
    expect(json.errors[0].message).toBe(
      'Invalid request: Variables query parameter must be valid JSON'
    )
  })

  it('should not allow mutations on GET requests', async () => {
    const url = new URL('http://localhost/api/graphql')
    url.searchParams.set('query', 'mutation { __typename }')
    const request = new Request(url, {
      method: 'GET',
    })

    const response = await GET(request)
    const json = await response.json()
    expect(
      json.errors.some((error: { message: string }) =>
        error.message.includes('GET requests may only execute query operations')
      )
    ).toBe(true)
  })

  it('should return schema via GET and set cache headers', async () => {
    const schemaQuery = 'query { schema }'
    const url = new URL('http://localhost/api/graphql')
    url.searchParams.set('query', schemaQuery)
    const request = new Request(url, {
      method: 'GET',
    })

    const response = await GET(request)
    const json = await response.json()
    expect(json.errors).toBeUndefined()

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toBe('public, s-maxage=3600, stale-while-revalidate=300')
    expect(json.data.schema).toBeDefined()
  })
})
