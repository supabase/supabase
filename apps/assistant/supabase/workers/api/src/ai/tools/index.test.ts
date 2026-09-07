import { jsonSchema } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTools } from './index'
import { getMcpTools } from './mcp-tools'

vi.mock('./mcp-tools', () => ({
  getMcpTools: vi.fn(),
}))
vi.mock('./project-tools', () => ({
  getProjectToolDefinitions: vi.fn(() => ({ studio_tool: {} })),
}))
vi.mock('./schema-tools', () => ({ getSchemaTools: vi.fn(() => ({ schema_tool: {} })) }))
vi.mock('./incident-tools', () => ({ getIncidentTools: vi.fn(() => ({ incident_tool: {} })) }))
vi.mock('./support-tools', () => ({
  getSupportLifecycleTools: vi.fn(() => ({ escalate_to_human: {} })),
}))

const BASE_PARAMS = {
  aiOptInLevel: 'schema' as const,
  projectRef: 'abcdefghijklmnopqrst',
  oauthToken: 'oauth-token',
  executeOperation: vi.fn(),
  managementApi: {
    runQuery: vi.fn(),
    deployFunction: vi.fn(),
  },
  signal: new AbortController().signal,
}

describe('ai/tools getTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMcpTools).mockResolvedValue({
      tools: { list_tables: { inputSchema: jsonSchema({ type: 'object' }) } },
      close: vi.fn(),
    })
  })

  it('includes project, MCP, schema and incident tools', async () => {
    const { tools } = await getTools(BASE_PARAMS)

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
      tools: {
        list_tables: { inputSchema: jsonSchema({ type: 'object' }) },
        studio_tool: { inputSchema: jsonSchema({ type: 'object' }) },
      },
      close: vi.fn(),
    })

    const { tools } = await getTools(BASE_PARAMS)

    expect(tools.studio_tool).toEqual({})
    expect(tools).toHaveProperty('list_tables')
  })

  it('propagates connection setup failures before constructing tools', async () => {
    const error = new Error('Connection setup failed')
    vi.mocked(getMcpTools).mockRejectedValueOnce(error)
    await expect(getTools(BASE_PARAMS)).rejects.toBe(error)
  })

  it('includes support tools when supportMode is true', async () => {
    const { tools } = await getTools({ ...BASE_PARAMS, supportMode: true })

    expect(tools).toHaveProperty('escalate_to_human')
  })
})
