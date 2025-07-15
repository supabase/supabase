import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiAuthenticate } from './apiAuthenticate'

const mocks = vi.hoisted(() => {
  return {
    getAuthUser: vi.fn().mockResolvedValue({
      user: {
        id: 'test-gotrue-id',
        email: 'test@example.com',
      },
      error: null,
    }),
  }
})

vi.mock('lib/gotrue', () => ({
  getAuthUser: mocks.getAuthUser,
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
    vi.clearAllMocks()
    mocks.getAuthUser.mockResolvedValue({
      user: {
        id: 'test-gotrue-id',
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
    mocks.getAuthUser.mockResolvedValue({
      user: null,
      error: new Error('Auth failed'),
    })

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: new Error('Auth failed') })
  })

  it('should return error when user does not exist', async () => {
    mocks.getAuthUser.mockResolvedValue({
      user: null,
      error: null,
    })

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: new Error('The user does not exist') })
  })
})
