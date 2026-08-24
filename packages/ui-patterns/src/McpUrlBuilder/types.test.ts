import { describe, expect, it } from 'vitest'

import { MCP_CLIENT_DATA } from './clients.data'
import { getMcpUrl, type McpClientBaseConfig } from './types'

const SERVER_URL = 'https://mcp.supabase.com/mcp?project_ref=abc123&read_only=true'

/**
 * `windsurf` configures a stdio `mcp-remote` command that carries the URL in `args`, so its
 * config has no URL field to read back. It renders no instructions and no deep link, so it
 * never reaches `getMcpUrl`.
 */
const CLIENTS_WITHOUT_URL_IN_CONFIG = new Set(['windsurf'])

describe('getMcpUrl', () => {
  it.each(
    MCP_CLIENT_DATA.filter((client) => !CLIENTS_WITHOUT_URL_IN_CONFIG.has(client.key)).map(
      (client) => [client.key, client] as const
    )
  )('reads the server URL back out of the %s config', (_key, client) => {
    const base: McpClientBaseConfig = { mcpServers: { supabase: { url: SERVER_URL } } }
    const config = client.transformConfig ? client.transformConfig(base) : base

    expect(getMcpUrl(config)).toBe(SERVER_URL)
  })
})
