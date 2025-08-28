import { describe, expect, it, vi } from 'vitest'
import { POST } from '../route'

describe('/api/graphql error', () => {
  it('returns the error matching given error code and service', async () => {
    const errorQuery = `
      query {
        error(code: "test_code", service: AUTH) {
          code
          service
          httpStatusCode
          message
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: errorQuery }),
    })

    const result = await POST(request)
    const {
      data: { error },
      errors,
    } = await result.json()

    expect(errors).toBeUndefined()
    expect(error.code).toBe('test_code')
    expect(error.service).toBe('AUTH')
    expect(error.httpStatusCode).toBe(500)
    expect(error.message).toBe('This is a test error message')
  })

  it('returns error if no matching error exists', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const errorQuery = `
      query {
        error(code: "nonexistent_code", service: AUTH) {
          code
          service
          httpStatusCode
          message
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: errorQuery }),
    })

    const result = await POST(request)
    const {
      data: { error },
      errors,
    } = await result.json()

    expect(error).toBe(null)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/not found/i)

    vi.restoreAllMocks()
  })
})
