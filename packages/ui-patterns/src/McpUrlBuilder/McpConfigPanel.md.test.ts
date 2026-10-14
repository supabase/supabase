import { describe, expect, it } from 'vitest'

import { mcpConfigPanelMarkdown } from './McpConfigPanel.md'

describe('Devin setup in generated markdown', () => {
  it('includes native configuration and complete setup instructions', () => {
    const markdown = mcpConfigPanelMarkdown()
    const section = markdown.split('**Devin Desktop**')[1].split('**')[0]

    expect(section).toContain('"url": "https://mcp.supabase.com/mcp"')
    expect(section).not.toContain('mcp-remote')
    expect(section).toContain('devin mcp add -s user supabase "https://mcp.supabase.com/mcp"')
    expect(section).toContain('For hosted connections, authenticate with Supabase')
    expect(section).toContain('devin mcp login supabase')
    expect(section).toContain('%APPDATA%\\devin\\mcp_config.json')
    expect(section).toContain('devin mcp list')
  })
})
