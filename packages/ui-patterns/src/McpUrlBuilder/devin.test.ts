import { describe, expect, it } from 'vitest'

import { MCP_CLIENT_DATA } from './clients.data'
import { getMcpUrl as readMcpUrl } from './types'
import { getMcpUrl } from './utils/getMcpUrl'

const devin = MCP_CLIENT_DATA.find((client) => client.key === 'windsurf')!

describe('Devin native HTTP configuration', () => {
  it.each([
    {
      name: 'hosted with project and access options',
      options: {
        isPlatform: true,
        platformUrl: 'https://mcp.supabase.com/mcp',
        projectRef: 'test-project',
        readonly: true,
        features: ['database', 'docs'],
      },
      expected:
        'https://mcp.supabase.com/mcp?project_ref=test-project&read_only=true&features=database%2Cdocs',
    },
    {
      name: 'hosted without a project',
      options: { isPlatform: true, platformUrl: 'https://mcp.supabase.com/mcp' },
      expected: 'https://mcp.supabase.com/mcp',
    },
    {
      name: 'local without hosted project scope',
      options: {
        isPlatform: false,
        apiUrl: 'http://localhost:54321',
        projectRef: 'test-project',
        features: ['database'],
      },
      expected: 'http://localhost:54321/mcp?features=database',
    },
  ])('uses the URL directly for $name', ({ options, expected }) => {
    const { clientConfig, mcpUrl } = getMcpUrl({ ...options, selectedClient: devin })

    expect(mcpUrl).toBe(expected)
    expect(clientConfig).toEqual({ mcpServers: { supabase: { url: expected } } })
    expect(readMcpUrl(clientConfig)).toBe(expected)
  })
})
