import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'
import { getDebuggingOperations } from '@/lib/api/self-hosted/mcp'

const mockGetLints = vi.fn()

// Mock getLints to capture what arguments the MCP operations pass
vi.mock('@/lib/api/self-hosted/lints', () => ({
  getLints: (...args: unknown[]) => mockGetLints(...args),
}))

// Mock getProjectSettings to avoid assertSelfHosted() check
vi.mock('@/lib/api/self-hosted/settings', () => ({
  getProjectSettings: () => ({
    app_config: {
      db_schema: 'public',
      endpoint: 'localhost',
      protocol: 'http',
    },
    service_api_keys: [{ api_key: 'test', name: 'anon key', tags: 'anon' }],
  }),
}))

describe('MCP advisor operations pass exposedSchemas to getLints', () => {
  const headers = { Authorization: 'Bearer test' }

  beforeEach(() => {
    mockGetLints.mockResolvedValue({
      data: [
        {
          name: 'rls_disabled_in_public',
          title: 'RLS Disabled in Public',
          level: 'ERROR',
          categories: ['SECURITY'],
          description: 'test',
          detail: 'test',
          remediation: 'test',
          metadata: {},
          cache_key: 'test',
        },
        {
          name: 'unindexed_foreign_keys',
          title: 'Unindexed foreign keys',
          level: 'INFO',
          categories: ['PERFORMANCE'],
          description: 'test',
          detail: 'test',
          remediation: 'test',
          metadata: {},
          cache_key: 'test',
        },
      ],
      error: undefined,
    })
  })

  it.each(['getSecurityAdvisors', 'getPerformanceAdvisors'] as const)(
    '%s passes DEFAULT_EXPOSED_SCHEMAS to getLints',
    async (operation) => {
      const ops = getDebuggingOperations({ headers })
      await ops[operation]('test-project')

      expect(mockGetLints).toHaveBeenCalledWith(
        expect.objectContaining({ exposedSchemas: DEFAULT_EXPOSED_SCHEMAS })
      )
    }
  )

  it('getSecurityAdvisors should filter to SECURITY category', async () => {
    const ops = getDebuggingOperations({ headers })
    const result = await ops.getSecurityAdvisors('test-project')

    expect(result).toHaveLength(1)
    expect((result as Array<{ name: string }>)[0].name).toBe('rls_disabled_in_public')
  })

  it('getPerformanceAdvisors should filter to PERFORMANCE category', async () => {
    const ops = getDebuggingOperations({ headers })
    const result = await ops.getPerformanceAdvisors('test-project')

    expect(result).toHaveLength(1)
    expect((result as Array<{ name: string }>)[0].name).toBe('unindexed_foreign_keys')
  })
})
