import { describe, expect, it } from 'vitest'

import { getMcpUrl } from './getMcpUrl'

const platformUrl = 'https://mcp.supabase.com/mcp'

describe('getMcpUrl skip elicitations', () => {
  it('omits the parameter when no tools are selected', () => {
    const { mcpUrl } = getMcpUrl({ isPlatform: true, platformUrl, skipElicitations: [] })

    expect(new URL(mcpUrl).searchParams.has('skip_elicitations')).toBe(false)
  })

  it('encodes the explicit selected tools in the URL and client config', () => {
    const { mcpUrl, clientConfig } = getMcpUrl({
      isPlatform: true,
      platformUrl,
      skipElicitations: ['execute_sql', 'apply_migration', 'create_project', 'create_branch'],
    })

    expect(new URL(mcpUrl).searchParams.get('skip_elicitations')).toBe(
      'execute_sql,apply_migration,create_project,create_branch'
    )
    expect(clientConfig).toEqual({ mcpServers: { supabase: { url: mcpUrl } } })
  })

  it('does not add hosted opt-outs to a non-platform connection', () => {
    const { mcpUrl } = getMcpUrl({
      isPlatform: false,
      apiUrl: 'http://localhost:54321',
      skipElicitations: ['execute_sql'],
    })

    expect(mcpUrl).toBe('http://localhost:54321/mcp')
  })
})
