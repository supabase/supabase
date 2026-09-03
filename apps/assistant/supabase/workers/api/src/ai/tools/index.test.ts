import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTools } from './index'
import { getMcpTools, McpUnauthorizedError } from './mcp-tools'

vi.mock('./mcp-tools', () => ({
  getMcpTools: vi.fn(),
  McpUnauthorizedError: class McpUnauthorizedError extends Error {},
}))
vi.mock('./project-tools', () => ({ getProjectTools: vi.fn(() => ({ studio_tool: {} })) }))
vi.mock('./schema-tools', () => ({ getSchemaTools: vi.fn(() => ({ schema_tool: {} })) }))
vi.mock('./incident-tools', () => ({ getIncidentTools: vi.fn(() => ({ incident_tool: {} })) }))
vi.mock('./support-tools', () => ({
  getSupportLifecycleTools: vi.fn(() => ({ escalate_to_human: {} })),
}))

const BASE_PARAMS = {
  projectRef: 'abcdefghijklmnopqrst',
  oauthToken: 'oauth-token',
  managementApi: {
    runQuery: vi.fn(),
    deployFunction: vi.fn(),
  },
  signal: new AbortController().signal,
}

describe('ai/tools getTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMcpTools).mockResolvedValue({ list_tables: {} } as any)
  })

  it('includes project, MCP, schema and incident tools', async () => {
    const tools = await getTools(BASE_PARAMS)

    expect(getMcpTools).toHaveBeenCalledWith({
      oauthToken: BASE_PARAMS.oauthToken,
      projectRef: BASE_PARAMS.projectRef,
      signal: BASE_PARAMS.signal,
    })
    expect(tools).toHaveProperty('studio_tool')
    expect(tools).toHaveProperty('list_tables')
    expect(tools).toHaveProperty('schema_tool')
    expect(tools).toHaveProperty('incident_tool')
  })

  it('lets harness tools override same-named MCP tools', async () => {
    vi.mocked(getMcpTools).mockResolvedValue({
      list_tables: {},
      studio_tool: { source: 'mcp' },
    } as any)

    const tools: Record<string, unknown> = await getTools(BASE_PARAMS)

    expect(tools.studio_tool).toEqual({})
    expect(tools).toHaveProperty('list_tables')
  })

  it('degrades gracefully to the remaining tools when remote MCP fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getMcpTools).mockRejectedValueOnce(new Error('remote MCP unreachable'))

    const tools = await getTools(BASE_PARAMS)

    expect(tools).toHaveProperty('studio_tool')
    expect(tools).toHaveProperty('schema_tool')
    expect(tools).toHaveProperty('incident_tool')
    expect(tools).not.toHaveProperty('list_tables')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('rethrows a rejected OAuth token instead of degrading', async () => {
    vi.mocked(getMcpTools).mockRejectedValueOnce(new McpUnauthorizedError('401'))

    await expect(getTools(BASE_PARAMS)).rejects.toBeInstanceOf(McpUnauthorizedError)
  })

  it('includes support tools when supportMode is true', async () => {
    const tools = await getTools({ ...BASE_PARAMS, supportMode: true })

    expect(tools).toHaveProperty('escalate_to_human')
  })
})
