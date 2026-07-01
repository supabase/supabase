import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTools } from './index'
import { getMcpTools } from './mcp-tools'

vi.mock('common', () => ({ IS_PLATFORM: true }))

vi.mock('./mcp-tools', () => ({ getMcpTools: vi.fn() }))
vi.mock('./studio-tools', () => ({ getStudioTools: vi.fn(() => ({ studio_tool: {} })) }))
vi.mock('./schema-tools', () => ({ getSchemaTools: vi.fn(() => ({ schema_tool: {} })) }))
vi.mock('./incident-tools', () => ({ getIncidentTools: vi.fn(() => ({ incident_tool: {} })) }))
vi.mock('./fallback-tools', () => ({ getFallbackTools: vi.fn(() => ({ fallback_tool: {} })) }))
// Identity filter so assertions can check the raw merged tool set
vi.mock('../tool-filter', () => ({ filterToolsByOptInLevel: vi.fn((tools) => tools) }))

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
    vi.clearAllMocks()
    vi.mocked(getMcpTools).mockResolvedValue({ list_tables: {} } as any)
    // Reset to platform each test; the self-hosted test overrides to false.
    // Done here (not afterEach) so the spy can't leak across tests via order.
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)
  })

  it('includes studio, MCP, schema and incident tools on platform', async () => {
    const tools = await getTools(BASE_PARAMS)

    expect(getMcpTools).toHaveBeenCalledWith({
      accessToken: BASE_PARAMS.accessToken,
      projectRef: BASE_PARAMS.projectRef,
      aiOptInLevel: BASE_PARAMS.aiOptInLevel,
      signal: BASE_PARAMS.signal,
    })
    expect(tools).toHaveProperty('studio_tool')
    expect(tools).toHaveProperty('list_tables')
    expect(tools).toHaveProperty('schema_tool')
    expect(tools).toHaveProperty('incident_tool')
  })

  it('degrades gracefully to the remaining tools when remote MCP fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getMcpTools).mockRejectedValueOnce(new Error('remote MCP unreachable'))

    const tools = await getTools(BASE_PARAMS)

    // The assistant still works with the non-MCP tools instead of throwing
    expect(tools).toHaveProperty('studio_tool')
    expect(tools).toHaveProperty('schema_tool')
    expect(tools).toHaveProperty('incident_tool')
    expect(tools).not.toHaveProperty('list_tables')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('does not fetch MCP tools when no access token is provided', async () => {
    const tools = await getTools({ ...BASE_PARAMS, accessToken: undefined })

    expect(getMcpTools).not.toHaveBeenCalled()
    expect(tools).toHaveProperty('studio_tool')
    expect(tools).not.toHaveProperty('list_tables')
  })

  it('uses fallback tools and skips MCP when self-hosted', async () => {
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(false)

    const tools = await getTools(BASE_PARAMS)

    expect(getMcpTools).not.toHaveBeenCalled()
    expect(tools).toHaveProperty('studio_tool')
    expect(tools).toHaveProperty('fallback_tool')
    expect(tools).not.toHaveProperty('list_tables')
  })
})
