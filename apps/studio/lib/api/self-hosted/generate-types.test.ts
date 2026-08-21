import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateTypescriptTypes } from './generate-types'

vi.mock('@/data/fetchers', () => ({
  fetchGet: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  PG_META_URL: 'http://localhost:8080',
}))

vi.mock('./util', () => ({
  assertSelfHosted: vi.fn(),
}))

// A distinctive, non-default value so the assertions verify the URL reflects the
// configured exposed schemas (PGRST_DB_SCHEMAS) — whatever they are — rather than
// coupling the test to a specific default.
const EXPOSED_SCHEMAS = 'public,custom_schema,graphql_public'
vi.mock('./constants', () => ({
  DEFAULT_EXPOSED_SCHEMAS: 'public,custom_schema,graphql_public',
}))

describe('api/self-hosted/generate-types', () => {
  let mockFetchGet: ReturnType<typeof vi.fn>
  let mockAssertSelfHosted: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const fetchers = await import('@/data/fetchers')
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

    it('should request types for the configured exposed schemas', async () => {
      mockFetchGet.mockResolvedValue({ types: 'export type User = {}' })

      await generateTypescriptTypes({ headers: {} })

      const callUrl = mockFetchGet.mock.calls[0][0]
      expect(callUrl).toContain('http://localhost:8080/generators/typescript')
      // Forwards the exposed-schemas config verbatim as the plural allowlist param.
      expect(callUrl).toContain(`included_schemas=${EXPOSED_SCHEMAS}`)
      // No hardcoded exclude list — the exposed-schemas config is the source of truth.
      expect(callUrl).not.toContain('excluded_schemas=')
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
  })
})
