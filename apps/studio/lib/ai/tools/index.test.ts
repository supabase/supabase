import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTools } from './index'
import { getMcpTools } from './mcp-tools'

vi.mock('common', () => ({ IS_PLATFORM: true }))

vi.mock('./mcp-tools', () => ({ getMcpTools: vi.fn() }))
vi.mock('./registry.server', () => ({ buildLocalTools: vi.fn(() => ({ local_tool: {} })) }))
// Identity filter so assertions can check the raw merged tool set
vi.mock('../tool-filter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../tool-filter')>()),
  filterToolsByOptInLevel: vi.fn((tools) => tools),
}))

const BASE_PARAMS = {
  projectRef: 'abcdefghijklmnopqrst',
  connectionString: 'postgresql://localhost',
  authorization: 'Bearer token',
  aiOptInLevel: 'schema_and_log_and_data' as const,
  accessToken: 'access-token',
  baseUrl: 'https://supabase.com/dashboard',
  signal: new AbortController().signal,
}

describe('ai/tools getTools', () => {
  beforeEach(async () => {
    vi.mocked(getMcpTools).mockResolvedValue({ list_tables: {} } as any)
    // Reset to platform each test; the self-hosted test overrides to false.
    // Done here (not afterEach) so the spy can't leak across tests via order.
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)
  })

  it('includes local and MCP tools on platform', async () => {
    const tools = await getTools(BASE_PARAMS)

    expect(getMcpTools).toHaveBeenCalledWith({
      accessToken: BASE_PARAMS.accessToken,
      projectRef: BASE_PARAMS.projectRef,
      aiOptInLevel: BASE_PARAMS.aiOptInLevel,
      signal: BASE_PARAMS.signal,
    })
    expect(tools).toHaveProperty('local_tool')
    expect(tools).toHaveProperty('list_tables')
  })

  it('builds local tools from the request context and the satisfied requirements', async () => {
    const { buildLocalTools } = await import('./registry.server')

    await getTools({ ...BASE_PARAMS, isExplorerEnabled: true, supportMode: true })

    expect(buildLocalTools).toHaveBeenLastCalledWith(
      {
        projectRef: BASE_PARAMS.projectRef,
        connectionString: BASE_PARAMS.connectionString,
        authorization: BASE_PARAMS.authorization,
        aiOptInLevel: BASE_PARAMS.aiOptInLevel,
        baseUrl: BASE_PARAMS.baseUrl,
      },
      {
        environment: 'platform',
        satisfied: new Set(['explorer', 'supportMode', 'baseUrl']),
      }
    )
  })

  it('degrades gracefully to the remaining tools when remote MCP fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getMcpTools).mockRejectedValueOnce(new Error('remote MCP unreachable'))

    const tools = await getTools(BASE_PARAMS)

    // The assistant still works with the non-MCP tools instead of throwing
    expect(tools).toHaveProperty('local_tool')
    expect(tools).not.toHaveProperty('list_tables')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('does not fetch MCP tools when no access token is provided', async () => {
    const tools = await getTools({ ...BASE_PARAMS, accessToken: undefined })

    expect(getMcpTools).not.toHaveBeenCalled()
    expect(tools).toHaveProperty('local_tool')
    expect(tools).not.toHaveProperty('list_tables')
  })

  it('skips MCP when self-hosted', async () => {
    const { buildLocalTools } = await import('./registry.server')
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(false)

    const tools = await getTools(BASE_PARAMS)

    expect(getMcpTools).not.toHaveBeenCalled()
    expect(buildLocalTools).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ environment: 'self-hosted' })
    )
    expect(tools).toHaveProperty('local_tool')
    expect(tools).not.toHaveProperty('list_tables')
  })

  it('lets a local tool win over an MCP tool of the same name', async () => {
    const { buildLocalTools } = await import('./registry.server')
    const localTool = { description: 'local' }
    vi.mocked(buildLocalTools).mockReturnValueOnce({ list_tables: localTool } as never)

    const tools = await getTools(BASE_PARAMS)

    expect(tools.list_tables).toBe(localTool)
  })
})
