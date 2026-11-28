import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
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

  it.each([
    ['security', 'getSecurityAdvisors', 'rls_disabled_in_public'],
    ['performance', 'getPerformanceAdvisors', 'unindexed_foreign_keys'],
  ] as const)('preserves the %s advisor array over MCP', async (type, operation, name) => {
    const lints = (await mockGetLints()).data
    const expected = lints.filter((lint: { name: string }) => lint.name === name)
    const ops = getDebuggingOperations({ headers })
    const server = createSupabaseMcpServer({
      platform: { debugging: ops },
      projectId: 'test-project',
      features: ['debugging'],
    })
    const client = new Client({ name: 'studio-advisor-test', version: '1.0.0' })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    await server.connect(serverTransport)
    await client.connect(clientTransport)

    try {
      expect(await ops[operation]('test-project')).toEqual(expected)
      const result = await client.callTool({ name: 'get_advisors', arguments: { type } })
      expect(result.isError).not.toBe(true)
      expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ result: expected }) }])
    } finally {
      await client.close()
      await server.close()
    }
  })

  it.each(['getSecurityAdvisors', 'getPerformanceAdvisors'] as const)(
    '%s propagates lint errors',
    async (operation) => {
      const error = new Error('Unable to retrieve database lints')
      mockGetLints.mockResolvedValue({ data: undefined, error })
      const ops = getDebuggingOperations({ headers })

      await expect(ops[operation]('test-project')).rejects.toBe(error)
    }
  )
})
