import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiAuthenticate } from './apiAuthenticate'
import { readOnly } from './supabaseClient'

const mocks = vi.hoisted(() => {
  return {
    getAuthUser: vi.fn().mockResolvedValue({
      user: {
        id: 'test-gotrue-id',
        email: 'test@example.com',
      },
      error: null,
    }),
    getIdentity: vi.fn().mockReturnValue({
      identity: null,
      error: null,
    }),
    getAuth0Id: vi.fn(),
  }
})

// Mock dependencies
vi.mock('./supabaseClient', () => ({
  readOnly: {
    from: vi.fn(),
  },
}))

vi.mock('lib/gotrue', () => ({
  getAuthUser: mocks.getAuthUser,
  getIdentity: mocks.getIdentity,
  getAuth0Id: mocks.getAuth0Id,
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
    mocks.getIdentity.mockReturnValue({
      identity: null,
      error: null,
    })
  })

  it('should return error when request is not available', async () => {
    const result = await apiAuthenticate(null as any, mockRes)
    expect(result).toStrictEqual({ error: new Error('Request is not available') })
  })

  it('should return error when response is not available', async () => {
    const result = await apiAuthenticate(mockReq, null as any)
    expect(result).toStrictEqual({ error: new Error('Response is not available') })
  })

  it('should return error when authorization token is missing', async () => {
    const reqWithoutToken = { ...mockReq, headers: {} }
    const result = await apiAuthenticate(reqWithoutToken, mockRes)
    expect(result).toStrictEqual({ error: { name: 'Error', message: 'missing access token' } })
  })

  it('should return error when auth user fetch fails', async () => {
    mocks.getAuthUser.mockResolvedValue({
      user: null,
      error: new Error('Auth failed'),
    })

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: { name: 'Error', message: 'Auth failed' } })
  })

  it('should handle identity error', async () => {
    mocks.getIdentity.mockReturnValue({
      identity: null,
      error: new Error('Identity error'),
    })

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: { name: 'Error', message: 'Identity error' } })
  })

  it('should set auth0 id when identity provider is present', async () => {
    mocks.getIdentity.mockReturnValue({
      identity: {
        provider: 'auth0',
        id: 'auth0-id',
      },
      error: null,
    })
    mocks.getAuth0Id.mockReturnValue('auth0-user-id')

    // Mock user query
    vi.mocked(readOnly.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: 'test-user-id', primary_email: 'test@example.com' } }),
    } as any)

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({
      id: 'test-user-id',
      primary_email: 'test@example.com',
    })
    expect(mocks.getAuth0Id).toHaveBeenCalledWith('auth0', 'auth0-id')
  })

  it('should return user when user_id_supabase is present', async () => {
    // Mock identity to return auth0 provider
    mocks.getIdentity.mockReturnValue({
      identity: {
        provider: 'auth0',
        id: 'auth0-id',
      },
      error: null,
    })
    mocks.getAuth0Id.mockReturnValue('auth0-user-id')

    // Mock user query to return a user with auth0_id
    vi.mocked(readOnly.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'supabase-user-id',
          auth0_id: 'auth0-user-id',
          primary_email: 'test@example.com',
        },
      }),
    } as any)

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({
      id: 'supabase-user-id',
      auth0_id: 'auth0-user-id',
      primary_email: 'test@example.com',
    })
  })

  it('should return error when user does not exist', async () => {
    vi.mocked(readOnly.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    } as any)

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: new Error('The user does not exist') })
  })

  it('should check organization permissions when orgSlug is provided', async () => {
    const reqWithOrg = {
      ...mockReq,
      query: { slug: 'test-org' },
    }

    // Mock user query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: 'test-user-id', primary_email: 'test@example.com' } }),
    } as any)

    // Mock organization query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'org-id' } }),
    } as any)

    // Mock member check
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, status: 200 }),
    } as any)

    const result = await apiAuthenticate(reqWithOrg, mockRes)
    expect(result).toStrictEqual({
      id: 'test-user-id',
      primary_email: 'test@example.com',
    })
  })

  it('should return error when user lacks organization permissions', async () => {
    const reqWithOrg = {
      ...mockReq,
      query: { slug: 'test-org' },
    }

    // Mock user query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: 'test-user-id', primary_email: 'test@example.com' } }),
    } as any)

    // Mock organization query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'org-id' } }),
    } as any)

    // Mock member check failure
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error('Permission denied')),
    } as any)

    const result = await apiAuthenticate(reqWithOrg, mockRes)
    expect(result).toStrictEqual({
      error: { name: 'Error', message: 'The user does not have permission' },
    })
  })

  it('should handle unknown errors gracefully', async () => {
    mocks.getAuthUser.mockRejectedValue(new Error('Unexpected error'))

    const result = await apiAuthenticate(mockReq, mockRes)
    expect(result).toStrictEqual({ error: { name: 'Error', message: 'Unexpected error' } })
  })

  it('should get organization from project reference', async () => {
    const reqWithProject = {
      ...mockReq,
      query: { ref: 'test-project' },
    }

    // Mock user query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: 'test-user-id', primary_email: 'test@example.com' } }),
    } as any)

    // Mock project query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { organization_id: 'org-id' } }),
    } as any)

    // Mock member check
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'member-id' }, status: 200 }),
    } as any)

    const result = await apiAuthenticate(reqWithProject, mockRes)
    expect(result).toStrictEqual({
      id: 'test-user-id',
      primary_email: 'test@example.com',
    })
  })

  it('should use organization_id from projectRef in member check', async () => {
    const reqWithProject = {
      ...mockReq,
      query: { ref: 'project-xyz' },
    }

    // Mock user query
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: 'user-123', primary_email: 'user@example.com' } }),
    } as any)

    // Mock project query to return a specific organization_id
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { organization_id: 'org-abc' } }),
    } as any)

    // Spy on the match function for the member check
    const matchSpy = vi.fn().mockReturnThis()
    vi.mocked(readOnly.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      match: matchSpy,
      single: vi.fn().mockResolvedValue({ data: { id: 'member-1' }, status: 200 }),
    } as any)

    const result = await apiAuthenticate(reqWithProject, mockRes)
    expect(result).toStrictEqual({
      id: 'user-123',
      primary_email: 'user@example.com',
    })
    // Ensure the member check used the org id from the project lookup
    expect(matchSpy).toHaveBeenCalledWith({ organization_id: 'org-abc', user_id: 'user-123' })
  })
})
