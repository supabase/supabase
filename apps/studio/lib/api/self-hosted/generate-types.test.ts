import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateTypescriptTypes } from './generate-types'

vi.mock('data/fetchers', () => ({
  fetchGet: vi.fn(),
}))

vi.mock('lib/constants', () => ({
  PG_META_URL: 'http://localhost:8080',
}))

vi.mock('./util', () => ({
  assertSelfHosted: vi.fn(),
}))

describe('api/self-hosted/generate-types', () => {
  let mockFetchGet: ReturnType<typeof vi.fn>
  let mockAssertSelfHosted: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const fetchers = await import('data/fetchers')
    const util = await import('./util')

    mockFetchGet = vi.mocked(fetchers.fetchGet)
    mockAssertSelfHosted = vi.mocked(util.assertSelfHosted)
  })

  describe('generateTypescriptTypes', () => {
    it('should call assertSelfHosted', async () => {
      mockFetchGet.mockResolvedValue({ types: 'export type User = {}' })

      await generateTypescriptTypes({ headers: {} })

      expect(mockAssertSelfHosted).toHaveBeenCalled()
    })

    it('should fetch from correct URL with schema params', async () => {
      mockFetchGet.mockResolvedValue({ types: 'export type User = {}' })

      await generateTypescriptTypes({ headers: {} })

      expect(mockFetchGet).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8080/generators/typescript'),
        expect.any(Object)
      )

      const callUrl = mockFetchGet.mock.calls[0][0]
      expect(callUrl).toContain('included_schema=public,graphql_public,storage')
      expect(callUrl).toContain('excluded_schemas=')
    })

    it('should include correct schemas in URL', async () => {
      mockFetchGet.mockResolvedValue({ types: '' })

      await generateTypescriptTypes({ headers: {} })

      const callUrl = mockFetchGet.mock.calls[0][0]
      expect(callUrl).toContain('public')
      expect(callUrl).toContain('graphql_public')
      expect(callUrl).toContain('storage')
    })

    it('should exclude system schemas', async () => {
      mockFetchGet.mockResolvedValue({ types: '' })

      await generateTypescriptTypes({ headers: {} })

      const callUrl = mockFetchGet.mock.calls[0][0]
      const excludedSchemas = [
        'auth',
        'cron',
        'extensions',
        'graphql',
        'net',
        'pgsodium',
        'pgsodium_masks',
        'realtime',
        'supabase_functions',
        'supabase_migrations',
        'vault',
        '_analytics',
        '_realtime',
      ]

      excludedSchemas.forEach((schema) => {
        expect(callUrl).toContain(schema)
      })
    })

    it('should pass headers to fetchGet', async () => {
      mockFetchGet.mockResolvedValue({ types: 'export type User = {}' })

      const customHeaders = {
        Authorization: 'Bearer token',
        'Custom-Header': 'value',
      }

      await generateTypescriptTypes({ headers: customHeaders })

      expect(mockFetchGet).toHaveBeenCalledWith(expect.any(String), {
        headers: customHeaders,
      })
    })

    it('should return types from fetchGet response', async () => {
      const mockTypes = 'export type User = { id: number; name: string }'
      mockFetchGet.mockResolvedValue({ types: mockTypes })

      const result = await generateTypescriptTypes({ headers: {} })

      expect(result).toEqual({ types: mockTypes })
    })

    it('should handle fetchGet errors', async () => {
      const mockError = new Error('Network error')
      mockFetchGet.mockRejectedValue(mockError)

      await expect(generateTypescriptTypes({ headers: {} })).rejects.toThrow('Network error')
    })

    it('should work without headers parameter', async () => {
      mockFetchGet.mockResolvedValue({ types: '' })

      await generateTypescriptTypes({})

      expect(mockFetchGet).toHaveBeenCalledWith(expect.any(String), { headers: undefined })
    })

    it('should construct URL with both included and excluded schemas', async () => {
      mockFetchGet.mockResolvedValue({ types: '' })

      await generateTypescriptTypes({ headers: {} })

      const callUrl = mockFetchGet.mock.calls[0][0]
      expect(callUrl).toContain('included_schema=')
      expect(callUrl).toContain('excluded_schemas=')
    })
  })
})
