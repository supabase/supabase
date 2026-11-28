import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiAuthenticate, authenticateRequest } from './apiAuthenticate'

const mocks = vi.hoisted(() => {
  return {
    getUserClaims: vi.fn().mockResolvedValue({
      claims: {
        sub: 'test-gotrue-id',
        email: 'test@example.com',
      },
      error: null,
    }),
  }
})

vi.mock('@/lib/gotrue', () => ({
  getUserClaims: mocks.getUserClaims,
}))

describe('apiAuthenticate', () => {
  const mockReq = {
    headers: {
      authorization: 'Bearer test-token',
    },
    query: {},
  } as any

  const mockRes = {} as any

  beforeEach(() => {
    mocks.getUserClaims.mockResolvedValue({
      claims: {
        sub: 'test-gotrue-id',
        email: 'test@example.com',
      },
      error: null,
    })
  })

  it('should return error when authorization token is missing', async () => {
    const reqWithoutToken = { ...mockReq, headers: {} }
    const result = await apiAuthenticate(reqWithoutToken, mockRes)
    expect(result).toStrictEqual({ error: new Error('missing access token') })
  })

  it('should return error when auth user fetch fails', async () => {
    mocks.getUserClaims.mockResolvedValue({
      claims: null,
      error: new Error('Auth failed'),
    })

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: new Error('Auth failed') })
  })

  it('should return error when user does not exist', async () => {
    mocks.getUserClaims.mockResolvedValue({
      claims: null,
      error: null,
    })

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: new Error('The user does not exist') })
  })
})

describe('authenticateRequest', () => {
  beforeEach(() => {
    mocks.getUserClaims.mockResolvedValue({
      claims: {
        sub: 'test-gotrue-id',
        email: 'test@example.com',
      },
      error: null,
    })
  })

  it('returns claims when authorization header contains a valid bearer token', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer test-token' },
    })

    const result = await authenticateRequest(request)
    expect(result).toStrictEqual({
      sub: 'test-gotrue-id',
      email: 'test@example.com',
    })
    expect(mocks.getUserClaims).toHaveBeenCalledWith('test-token')
  })

  it('returns error when authorization header is missing', async () => {
    const request = new Request('http://localhost/api/test')

    const result = await authenticateRequest(request)
    expect(result).toStrictEqual({ error: new Error('missing access token') })
  })

  it('returns error when auth user fetch fails', async () => {
    mocks.getUserClaims.mockResolvedValue({
      claims: null,
      error: new Error('Auth failed'),
    })

    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer test-token' },
    })

    const result = await authenticateRequest(request)
    expect(result).toStrictEqual({ error: new Error('Auth failed') })
  })

  it('returns error when user does not exist', async () => {
    mocks.getUserClaims.mockResolvedValue({
      claims: null,
      error: null,
    })

    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer test-token' },
    })

    const result = await authenticateRequest(request)
    expect(result).toStrictEqual({ error: new Error('The user does not exist') })
  })
})
