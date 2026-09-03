import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getValidAccessToken, readOAuthTokens, storeOAuthTokens } from './oauth-connections'
import { adminQuery } from './postgres'

vi.mock('./postgres', () => ({
  adminQuery: vi.fn(),
}))

vi.mock('../platform/oauth', () => ({
  refreshToken: vi.fn(),
  tokenExpiresAt: vi.fn(),
  tokenScopes: vi.fn(() => []),
}))

const adminQueryMock = vi.mocked(adminQuery)

describe('oauth-connections vault RPCs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads tokens over Postgres, not PostgREST', async () => {
    adminQueryMock.mockResolvedValueOnce([
      {
        access_token: 'access',
        refresh_token: 'refresh',
        expires_at: '2099-01-01T00:00:00.000Z',
        scopes: ['projects:read'],
      },
    ])

    const tokens = await readOAuthTokens('11111111-1111-1111-1111-111111111111', 'acme')

    expect(adminQueryMock).toHaveBeenCalledWith(
      expect.stringContaining('private.read_oauth_tokens($1::uuid, $2)'),
      ['11111111-1111-1111-1111-111111111111', 'acme']
    )
    expect(tokens).toEqual({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: '2099-01-01T00:00:00.000Z',
      scopes: ['projects:read'],
    })
  })

  it('returns null when no token row exists', async () => {
    adminQueryMock.mockResolvedValueOnce([])
    await expect(readOAuthTokens('11111111-1111-1111-1111-111111111111', 'acme')).resolves.toBeNull()
  })

  it('stores tokens via private.store_oauth_tokens', async () => {
    adminQueryMock.mockResolvedValueOnce([])

    await storeOAuthTokens({
      userId: '11111111-1111-1111-1111-111111111111',
      orgSlug: 'acme',
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: ['projects:read'],
    })

    expect(adminQueryMock).toHaveBeenCalledWith(
      expect.stringContaining('private.store_oauth_tokens('),
      [
        '11111111-1111-1111-1111-111111111111',
        'acme',
        'access',
        'refresh',
        '2099-01-01T00:00:00.000Z',
        ['projects:read'],
      ]
    )
  })

  it('returns a still-valid access token without refreshing', async () => {
    adminQueryMock.mockResolvedValueOnce([
      {
        access_token: 'access',
        refresh_token: 'refresh',
        expires_at: '2099-01-01T00:00:00.000Z',
        scopes: ['projects:read'],
      },
    ])

    await expect(
      getValidAccessToken('11111111-1111-1111-1111-111111111111', 'acme')
    ).resolves.toBe('access')
    expect(adminQueryMock).toHaveBeenCalledTimes(1)
  })
})
