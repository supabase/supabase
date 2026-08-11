import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createInProcessSupabaseMCPClient, createSupabaseMCPClient } from '../supabase-mcp'
import { getMcpTools } from './mcp-tools'

vi.mock('../supabase-mcp', () => ({
  createSupabaseMCPClient: vi.fn(),
  createInProcessSupabaseMCPClient: vi.fn(),
}))

const BASE_PARAMS = {
  accessToken: 'token',
  projectRef: 'abcdefghijklmnopqrst',
  aiOptInLevel: 'schema_and_log_and_data' as const,
  // A fresh, non-aborted signal by default; lifecycle tests override it
  signal: new AbortController().signal,
}

// A realistic remote tool set: all expected read tools plus the UI-executed ones
const FULL_REMOTE_TOOLS = {
  search_docs: { description: 'docs' },
  list_tables: { description: 'list tables' },
  list_extensions: { description: 'extensions' },
  list_edge_functions: { description: 'edge functions' },
  list_branches: { description: 'branches' },
  get_advisors: { description: 'advisors' },
  get_logs: { description: 'get logs' },
  execute_sql: { description: 'execute sql' },
  deploy_edge_function: { description: 'deploy' },
}

describe('ai/tools/mcp-tools getMcpTools', () => {
  let close: ReturnType<typeof vi.fn>
  let tools: ReturnType<typeof vi.fn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // These tests exercise the remote transport; pin the migration gate to it.
    process.env.USE_REMOTE_MCP = 'true'
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    close = vi.fn().mockResolvedValue(undefined)
    tools = vi.fn().mockResolvedValue({ ...FULL_REMOTE_TOOLS })
    vi.mocked(createSupabaseMCPClient).mockResolvedValue({ tools, close } as any)
  })

  afterEach(() => {
    delete process.env.USE_REMOTE_MCP
    consoleErrorSpy.mockRestore()
  })

  it('returns MCP tools and strips UI-executed tools handled locally', async () => {
    const result = await getMcpTools(BASE_PARAMS)

    expect(result).toHaveProperty('list_tables')
    expect(result).toHaveProperty('get_logs')
    expect(result).not.toHaveProperty('execute_sql')
    expect(result).not.toHaveProperty('deploy_edge_function')
  })

  it('warns when the remote server is missing an expected tool (contract drift)', async () => {
    const { list_branches, ...withoutBranches } = FULL_REMOTE_TOOLS
    tools.mockResolvedValueOnce(withoutBranches)

    await getMcpTools(BASE_PARAMS)

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('list_branches'))
  })

  it('does not warn about drift when all expected tools are present', async () => {
    await getMcpTools(BASE_PARAMS)

    const driftWarnings = consoleErrorSpy.mock.calls.filter(
      ([msg]: unknown[]) => typeof msg === 'string' && msg.includes('missing expected tools')
    )
    expect(driftWarnings).toHaveLength(0)
  })

  it('keeps the connection open until the request signal aborts', async () => {
    const controller = new AbortController()

    await getMcpTools({ ...BASE_PARAMS, signal: controller.signal })
    // Tools execute later during streaming, so the client must stay open
    expect(close).not.toHaveBeenCalled()

    controller.abort()
    await Promise.resolve()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the client and skips fetching tools when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await getMcpTools({ ...BASE_PARAMS, signal: controller.signal })

    expect(close).toHaveBeenCalledTimes(1)
    expect(tools).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('closes the client and rethrows when fetching tools fails, without double-closing on later abort', async () => {
    tools.mockRejectedValueOnce(new Error('network unreachable'))
    const controller = new AbortController()

    await expect(getMcpTools({ ...BASE_PARAMS, signal: controller.signal })).rejects.toThrow(
      'network unreachable'
    )
    expect(close).toHaveBeenCalledTimes(1)

    // A subsequent abort must not close the (already closed) client again
    controller.abort()
    await Promise.resolve()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the client and rethrows when tool validation fails', async () => {
    // A known tool name with a non-object value passes the opt-in filter but
    // fails schema validation
    tools.mockResolvedValueOnce({ ...FULL_REMOTE_TOOLS, list_tables: 'not-an-object' })

    await expect(getMcpTools(BASE_PARAMS)).rejects.toThrow('MCP tools validation failed')
    expect(close).toHaveBeenCalledTimes(1)
  })
})

describe('ai/tools/mcp-tools getMcpTools transport selection', () => {
  let close: ReturnType<typeof vi.fn>
  let tools: ReturnType<typeof vi.fn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    close = vi.fn().mockResolvedValue(undefined)
    tools = vi.fn().mockResolvedValue({ ...FULL_REMOTE_TOOLS })
    vi.mocked(createSupabaseMCPClient).mockResolvedValue({ tools, close } as any)
    vi.mocked(createInProcessSupabaseMCPClient).mockResolvedValue({ tools, close } as any)
  })

  afterEach(() => {
    delete process.env.USE_REMOTE_MCP
    consoleErrorSpy.mockRestore()
  })

  it('uses the remote client when USE_REMOTE_MCP is "true"', async () => {
    process.env.USE_REMOTE_MCP = 'true'

    await getMcpTools(BASE_PARAMS)

    expect(createSupabaseMCPClient).toHaveBeenCalledTimes(1)
    expect(createInProcessSupabaseMCPClient).not.toHaveBeenCalled()
  })

  it('falls back to the in-process client when USE_REMOTE_MCP is unset (default)', async () => {
    delete process.env.USE_REMOTE_MCP

    await getMcpTools(BASE_PARAMS)

    expect(createInProcessSupabaseMCPClient).toHaveBeenCalledTimes(1)
    expect(createSupabaseMCPClient).not.toHaveBeenCalled()
  })

  it('uses the in-process client for any non-"true" value', async () => {
    process.env.USE_REMOTE_MCP = 'false'

    await getMcpTools(BASE_PARAMS)

    expect(createInProcessSupabaseMCPClient).toHaveBeenCalledTimes(1)
    expect(createSupabaseMCPClient).not.toHaveBeenCalled()
  })
})
