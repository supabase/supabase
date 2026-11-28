import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticateRequest } from './apiAuthenticate'

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
