import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseMCPClient } from './supabase-mcp'

const createMCPClientMock = vi.fn()

vi.mock('@ai-sdk/mcp', () => ({
  createMCPClient: (...args: any[]) => createMCPClientMock(...args),
}))

const ACCESS_TOKEN = 'test-access-token'
const PROJECT_REF = 'abcdefghijklmnopqrst'

function getTransportConfig() {
  expect(createMCPClientMock).toHaveBeenCalledTimes(1)
  return createMCPClientMock.mock.calls[0][0]
}

describe('createSupabaseMCPClient', () => {
  const originalMcpUrl = process.env.NEXT_PUBLIC_MCP_URL
  const originalSha = process.env.VERCEL_GIT_COMMIT_SHA

  beforeEach(() => {
    vi.clearAllMocks()
    createMCPClientMock.mockResolvedValue({ tools: vi.fn() })
    delete process.env.VERCEL_GIT_COMMIT_SHA
  })

  afterEach(() => {
    if (originalMcpUrl === undefined) delete process.env.NEXT_PUBLIC_MCP_URL
    else process.env.NEXT_PUBLIC_MCP_URL = originalMcpUrl
    if (originalSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA
    else process.env.VERCEL_GIT_COMMIT_SHA = originalSha
  })

  it('connects over the HTTP transport with the supabase-studio client name', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    const config = getTransportConfig()
    expect(config.name).toBe('supabase-studio')
    expect(config.transport.type).toBe('http')
  })

  it('targets the URL from NEXT_PUBLIC_MCP_URL with project_ref and read_only', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    const url = new URL(getTransportConfig().transport.url)
    expect(url.origin + url.pathname).toBe('https://mcp.supabase.com/mcp')
    expect(url.searchParams.get('project_ref')).toBe(PROJECT_REF)
    expect(url.searchParams.get('read_only')).toBe('true')
  })

  it('forwards the dashboard access token as a bearer header', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    expect(getTransportConfig().transport.headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`)
  })

  it('identifies assistant traffic with the x-source-name header', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    expect(getTransportConfig().transport.headers['x-source-name']).toBe('supabase-studio')
  })

  it('sends x-source-version from VERCEL_GIT_COMMIT_SHA when available', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc1234'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    expect(getTransportConfig().transport.headers['x-source-version']).toBe('abc1234')
  })

  it('omits x-source-version when VERCEL_GIT_COMMIT_SHA is not set', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'
    delete process.env.VERCEL_GIT_COMMIT_SHA

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    expect(getTransportConfig().transport.headers).not.toHaveProperty('x-source-version')
  })

  it('never leaks the access token into the URL', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    expect(getTransportConfig().transport.url).not.toContain(ACCESS_TOKEN)
  })

  it('always requests read-only mode', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    const url = new URL(getTransportConfig().transport.url)
    expect(url.searchParams.get('read_only')).toBe('true')
  })

  it('falls back to the default local URL when NEXT_PUBLIC_MCP_URL is unset', async () => {
    delete process.env.NEXT_PUBLIC_MCP_URL

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    const url = new URL(getTransportConfig().transport.url)
    expect(url.origin + url.pathname).toBe('http://localhost:8080/mcp')
    expect(url.searchParams.get('project_ref')).toBe(PROJECT_REF)
  })

  it('falls back to the default local URL when NEXT_PUBLIC_MCP_URL is an empty string', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = ''

    await createSupabaseMCPClient({ accessToken: ACCESS_TOKEN, projectRef: PROJECT_REF })

    const url = new URL(getTransportConfig().transport.url)
    expect(url.origin + url.pathname).toBe('http://localhost:8080/mcp')
  })

  it('returns the client created by createMCPClient', async () => {
    process.env.NEXT_PUBLIC_MCP_URL = 'https://mcp.supabase.com/mcp'
    const fakeClient = { tools: vi.fn() }
    createMCPClientMock.mockResolvedValueOnce(fakeClient)

    const client = await createSupabaseMCPClient({
      accessToken: ACCESS_TOKEN,
      projectRef: PROJECT_REF,
    })

    expect(client).toBe(fakeClient)
  })
})
