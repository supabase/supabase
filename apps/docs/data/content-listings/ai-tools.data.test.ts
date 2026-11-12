import { AGENT_CLIENT_PARAM, PLUGIN_CLIENTS } from '~/features/ui/AgentPluginsPanel.data'
import { MCP_CLIENT_DATA } from 'ui-patterns/McpUrlBuilder/clients.data'
import { describe, expect, it } from 'vitest'

import { aiToolsSupportedAgents } from './ai-tools.data'

const CLIENT_KEYS_BY_PAGE: Record<string, string[]> = {
  '/guides/ai-tools/plugins': PLUGIN_CLIENTS.map((client) => client.key),
  '/guides/ai-tools/mcp': MCP_CLIENT_DATA.map((client) => client.key),
}

describe('aiToolsSupportedAgents', () => {
  it('links each agent to a setup page that can preselect it', () => {
    for (const item of aiToolsSupportedAgents.items) {
      const url = new URL(item.href ?? '', 'https://supabase.com')
      expect(CLIENT_KEYS_BY_PAGE[url.pathname], item.title).toContain(
        url.searchParams.get(AGENT_CLIENT_PARAM)
      )
    }
  })
})
