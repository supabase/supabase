import { withToolPolicy } from '@supabase/agent-runtime'
import { jsonSchema } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMcpTools } from './mcp-tools'
import { assistantMcpToolPolicies } from './tool-policies'

const { close, tools, execute, create } = vi.hoisted(() => ({
  close: vi.fn(),
  tools: vi.fn(),
  execute: vi.fn(),
  create: vi.fn(),
}))
vi.mock('@ai-sdk/mcp', async (original) => ({
  ...(await original<typeof import('@ai-sdk/mcp')>()),
  createMCPClient: create,
}))
beforeEach(() => {
  vi.resetAllMocks()
  close.mockResolvedValue(undefined)
  create.mockResolvedValue({ tools, close })
  execute.mockResolvedValue({ content: [{ type: 'text', text: 'private data' }] })
  const tool = { type: 'dynamic', inputSchema: jsonSchema({ type: 'object' }), execute }
  tools.mockResolvedValue({
    search_docs: tool,
    list_tables: tool,
    query_logs: tool,
    execute_sql: tool,
    newly_added_write: tool,
  })
})
describe('MCP frontend contract and lifecycle', () => {
  it('preserves dynamic parts, excludes unknown/write capabilities, and closes only once', async () => {
    const controller = new AbortController()
    const result = await getMcpTools({
      projectRef: 'project',
      oauthToken: 'token',
      signal: controller.signal,
    })
    expect(tools).toHaveBeenCalledWith()
    expect(result.tools.list_tables.type).toBe('dynamic')
    expect(result.tools.execute_sql).toBeUndefined()
    expect(result.tools.newly_added_write).toBeUndefined()
    const permitted = withToolPolicy(result.tools, {
      context: 'schema',
      policies: assistantMcpToolPolicies,
    })
    await permitted.query_logs.execute!({}, { toolCallId: 't', messages: [], context: undefined })
    expect(execute).not.toHaveBeenCalled()
    await permitted.list_tables.execute!({}, { toolCallId: 't', messages: [], context: undefined })
    expect(execute).toHaveBeenCalledOnce()
    await result.close()
    controller.abort()
    await result.close()
    expect(close).toHaveBeenCalledOnce()
  })
  it('closes when setup fails or the request is aborted', async () => {
    tools.mockRejectedValueOnce(new Error('tools failed'))
    const unavailable = await getMcpTools({
      projectRef: 'project',
      oauthToken: 'token',
      signal: new AbortController().signal,
    })
    expect(unavailable.tools).toEqual({})
    expect(close).toHaveBeenCalledOnce()
    close.mockClear()
    const controller = new AbortController()
    const result = await getMcpTools({
      projectRef: 'project',
      oauthToken: 'token',
      signal: controller.signal,
    })
    controller.abort()
    await result.close()
    expect(close).toHaveBeenCalledOnce()
  })
})
