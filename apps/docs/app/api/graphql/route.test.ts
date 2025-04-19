import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

describe('GraphQL API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should return 400 if request body is not valid JSON', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: 'not json',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid request: Request body must be valid JSON')
  })

  it('should return 400 if request body is missing required fields', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ variables: {} }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(await response.text()).toContain('Request body must be a valid GraphQL request object')
  })

  it('should return 400 if query is not a string', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: 123 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 500 for internal server errors', async () => {
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: 'query { hello }' }),
    })

    vi.spyOn(request, 'json').mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Internal Server Error')
  })
})
