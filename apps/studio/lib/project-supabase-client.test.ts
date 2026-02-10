import * as supabaseJs from '@supabase/supabase-js'
import * as apiKeysUtils from 'data/api-keys/temp-api-keys-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createProjectSupabaseClient } from './project-supabase-client'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

vi.mock('data/api-keys/temp-api-keys-utils', () => ({
  getOrRefreshTemporaryApiKey: vi.fn(),
}))

describe('project-supabase-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createProjectSupabaseClient', () => {
    it('should create a Supabase client with temporary API key', async () => {
      const mockApiKey = 'test-api-key-123'
      const mockClient = { from: vi.fn() }
      const projectRef = 'test-project-ref'
      const clientEndpoint = 'https://test.supabase.co'

      apiKeysUtils.getOrRefreshTemporaryApiKey.mockResolvedValue({ apiKey: mockApiKey })
      supabaseJs.createClient.mockReturnValue(mockClient)

      const result = await createProjectSupabaseClient(projectRef, clientEndpoint)

      expect(apiKeysUtils.getOrRefreshTemporaryApiKey).toHaveBeenCalledWith(projectRef)
      expect(supabaseJs.createClient).toHaveBeenCalledWith(clientEndpoint, mockApiKey, {
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

    it('should configure storage to not persist session', async () => {
      const mockApiKey = 'test-api-key-456'
      const mockClient = { from: vi.fn() }

      apiKeysUtils.getOrRefreshTemporaryApiKey.mockResolvedValue({ apiKey: mockApiKey })
      supabaseJs.createClient.mockReturnValue(mockClient)

      await createProjectSupabaseClient('ref', 'https://example.com')

      const config = supabaseJs.createClient.mock.calls[0][2]
      const storage = config.auth.storage

      // Test storage methods return expected values
      expect(storage.getItem('any-key')).toBeNull()
      expect(storage.setItem('key', 'value')).toBeUndefined()
      expect(storage.removeItem('key')).toBeUndefined()
    })

    it('should throw error if API key retrieval fails', async () => {
      const error = new Error('Failed to get API key')
      apiKeysUtils.getOrRefreshTemporaryApiKey.mockRejectedValue(error)

      await expect(createProjectSupabaseClient('ref', 'https://example.com')).rejects.toThrow(
        'Failed to get API key'
      )

      expect(supabaseJs.createClient).not.toHaveBeenCalled()
    })

    it('should pass through different project refs and endpoints', async () => {
      const mockApiKey = 'api-key'
      const mockClient = { from: vi.fn() }

      apiKeysUtils.getOrRefreshTemporaryApiKey.mockResolvedValue({ apiKey: mockApiKey })
      supabaseJs.createClient.mockReturnValue(mockClient)

      await createProjectSupabaseClient('project-123', 'https://project123.supabase.co')

      expect(apiKeysUtils.getOrRefreshTemporaryApiKey).toHaveBeenCalledWith('project-123')
      expect(supabaseJs.createClient).toHaveBeenCalledWith(
        'https://project123.supabase.co',
        mockApiKey,
        expect.any(Object)
      )
    })

    it('should disable session persistence options', async () => {
      const mockApiKey = 'api-key'
      const mockClient = { from: vi.fn() }

      apiKeysUtils.getOrRefreshTemporaryApiKey.mockResolvedValue({ apiKey: mockApiKey })
      supabaseJs.createClient.mockReturnValue(mockClient)

      await createProjectSupabaseClient('ref', 'https://example.com')

      const config = supabaseJs.createClient.mock.calls[0][2]

      expect(config.auth.persistSession).toBe(false)
      expect(config.auth.autoRefreshToken).toBe(false)
      expect(config.auth.detectSessionInUrl).toBe(false)
    })
  })
})
