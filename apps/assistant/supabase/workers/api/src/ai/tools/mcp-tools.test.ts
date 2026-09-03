import { describe, expect, it, vi } from 'vitest'

vi.mock('../../env.ts', () => ({
  env: { mcpUrl: 'https://mcp.supabase.com/mcp' },
}))

import { getRemoteMcpUrl } from './mcp-tools'

describe('getRemoteMcpUrl', () => {
  it('scopes the hosted MCP server to the project in read-only mode', () => {
    expect(getRemoteMcpUrl('abcdefghijklmnop')).toBe(
      'https://mcp.supabase.com/mcp?project_ref=abcdefghijklmnop&read_only=true'
    )
  })
})
