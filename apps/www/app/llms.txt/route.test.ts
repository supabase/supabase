import { describe, expect, it, vi } from 'vitest'

import { GET } from './route'

vi.mock('common/enabled-features', () => ({
  isFeatureEnabled: () => ({
    sdkCsharp: true,
    sdkDart: false,
    sdkKotlin: true,
    sdkPython: true,
    sdkSwift: true,
  }),
}))

vi.mock('@/lib/agent-resources', () => ({
  AGENT_RESOURCES: [
    {
      title: 'Supabase MCP server setup',
      url: 'https://supabase.com/docs/guides/ai-tools/mcp',
      description: 'Connect an MCP client and authenticate',
    },
    {
      title: 'Supabase local development and CLI',
      url: 'https://supabase.com/docs/guides/local-development',
      description: 'Run the full Supabase stack locally',
    },
  ],
}))

const getBody = async () => {
  const response = await GET()
  return { response, body: await response.text() }
}

describe('llms.txt index handler', () => {
  it('serves Markdown with the existing cache policy', async () => {
    const { response } = await getBody()

    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    )
  })

  it('links the homepage Markdown and the guide and SDK sources', async () => {
    const { body } = await getBody()

    expect(body).toContain('- [Supabase](https://supabase.com/index.md)')
    expect(body).toContain('https://supabase.com/llms/js.txt')
    expect(body).toContain('https://supabase.com/llms/cli.txt')
    expect(body).toContain('https://supabase.com/llms/api.txt')
  })

  it('omits a disabled SDK reference and keeps the enabled ones', async () => {
    const { body } = await getBody()

    expect(body).not.toContain('llms/dart.txt')
    expect(body).toContain('llms/swift.txt')
    expect(body).toContain('llms/python.txt')
  })

  it('lists the agent setup resources with their descriptions', async () => {
    const { body } = await getBody()

    expect(body).toContain(
      '- [Supabase MCP server setup](https://supabase.com/docs/guides/ai-tools/mcp): Connect an MCP client and authenticate'
    )
    expect(body).toContain('https://supabase.com/docs/guides/local-development')
  })
})
