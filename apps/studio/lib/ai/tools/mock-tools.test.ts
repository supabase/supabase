import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockTools } from './mock-tools'
import { createInProcessSupabaseMCPClient } from '@/lib/ai/supabase-mcp'

// The one real tool in the eval harness (search_docs) is sourced from an
// in-process MCP client. Mock that client so this test stays hermetic and
// guards the wiring, not a live connection.
vi.mock('@/lib/ai/supabase-mcp', () => ({
  createInProcessSupabaseMCPClient: vi.fn(),
}))

const SEARCH_DOCS = { description: 'search the docs' }

describe('ai/tools/mock-tools getMockTools', () => {
  let close: ReturnType<typeof vi.fn>
  let tools: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    close = vi.fn().mockResolvedValue(undefined)
    tools = vi.fn().mockResolvedValue({ search_docs: SEARCH_DOCS })
    vi.mocked(createInProcessSupabaseMCPClient).mockResolvedValue({ tools, close } as any)
  })

  it('sources the real search_docs from the in-process MCP server alongside the deterministic mocks', async () => {
    const result = await getMockTools(undefined, new AbortController().signal)

    expect(createInProcessSupabaseMCPClient).toHaveBeenCalledTimes(1)
    // The real tool, wired through from the MCP client
    expect(result).toHaveProperty('search_docs', SEARCH_DOCS)
    // A couple of the deterministic mocks, to confirm the merge
    expect(result).toHaveProperty('list_tables')
    expect(result).toHaveProperty('get_logs')
  })

  // This is the regression guard: if the eval's MCP wiring breaks (contract
  // drift, or a refactor that stops sourcing search_docs — e.g. the future
  // AI-897 removal of the in-process client), fail loudly in normal CI instead
  // of only surfacing during an opt-in Braintrust eval run.
  it('throws a clear error when the MCP server does not expose search_docs', async () => {
    tools.mockResolvedValueOnce({})

    await expect(getMockTools(undefined, new AbortController().signal)).rejects.toThrow(
      'search_docs tool not available from MCP server'
    )
  })

  it('closes the MCP client when the caller aborts the signal', async () => {
    const controller = new AbortController()

    await getMockTools(undefined, controller.signal)
    // Connection stays open until generation ends (search_docs runs during it)
    expect(close).not.toHaveBeenCalled()

    controller.abort()
    await Promise.resolve()
    expect(close).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })
})
