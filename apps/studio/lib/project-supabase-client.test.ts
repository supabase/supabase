import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createProjectSupabaseClient } from './project-supabase-client'
import { getOrRefreshTemporaryApiKey } from 'data/api-keys/temp-api-keys-utils'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

vi.mock('data/api-keys/temp-api-keys-utils', () => ({
  getOrRefreshTemporaryApiKey: vi.fn(),
}))

describe('createProjectSupabaseClient', () => {
  const projectRef = 'test-project-ref'
  const clientEndpoint = 'https://test.supabase.co'
  const mockApiKey = 'test-api-key'
  const mockClient = { auth: {}, from: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockClient)
  })

  it('should create a Supabase client with temporary API key', async () => {
    ;(getOrRefreshTemporaryApiKey as any).mockResolvedValue({ apiKey: mockApiKey })

    const result = await createProjectSupabaseClient(projectRef, clientEndpoint)

    expect(getOrRefreshTemporaryApiKey).toHaveBeenCalledWith(projectRef)
    expect(createClient).toHaveBeenCalledWith(clientEndpoint, mockApiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: expect.any(Function),
          setItem: expect.any(Function),
          removeItem: expect.any(Function),
        },
      },
    })
    expect(result).toBe(mockClient)
  })

  it('should configure storage to return null for getItem', async () => {
    ;(getOrRefreshTemporaryApiKey as any).mockResolvedValue({ apiKey: mockApiKey })

    await createProjectSupabaseClient(projectRef, clientEndpoint)

    const storageConfig = (createClient as any).mock.calls[0][2].auth.storage
    expect(storageConfig.getItem('test-key')).toBeNull()
  })

  it('should configure storage with no-op setItem and removeItem', async () => {
    ;(getOrRefreshTemporaryApiKey as any).mockResolvedValue({ apiKey: mockApiKey })

    await createProjectSupabaseClient(projectRef, clientEndpoint)

    const storageConfig = (createClient as any).mock.calls[0][2].auth.storage
    expect(() => storageConfig.setItem('key', 'value')).not.toThrow()
    expect(() => storageConfig.removeItem('key')).not.toThrow()
  })

  it('should throw error when getOrRefreshTemporaryApiKey fails', async () => {
    const error = new Error('Failed to get API key')
    ;(getOrRefreshTemporaryApiKey as any).mockRejectedValue(error)

    await expect(createProjectSupabaseClient(projectRef, clientEndpoint)).rejects.toThrow(
      'Failed to get API key'
    )

    expect(createClient).not.toHaveBeenCalled()
  })
})
