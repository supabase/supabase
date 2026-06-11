import { describe, expect, it } from 'vitest'

import { buildStartAgentHtml, buildStartAgentMarkdown } from './StartAgentMarkdown'

describe('buildStartAgentMarkdown', () => {
  it('generates configuration instructions and a prompt plan from query params', () => {
    const markdown = buildStartAgentMarkdown(
      new URL(
        'https://supabase.com/docs/start?framework=vite&shadcn=false&primitives=database,auth,storage&orm=drizzle&connection=local&agent=codex&templates=storage-avatars'
      )
    )

    expect(markdown).toContain('## Current configuration')
    expect(markdown).toContain('- Framework: Vite + React (SPA)')
    expect(markdown).toContain('- UI: existing components')
    expect(markdown).toContain('- Services: Database, Auth, Storage')
    expect(markdown).toContain('- Data layer: Drizzle')
    expect(markdown).toContain('- Connection: local Supabase stack (Docker)')
    expect(markdown).toContain('- Agent: Codex')
    expect(markdown).toContain('storage-avatars')
    expect(markdown).toContain('## Customize via query params')
    expect(markdown).toContain('`primitives`: comma-separated values')
    expect(markdown).toContain('`agent`: `claude`, `codex`')
    expect(markdown).toContain('## Generated prompt.plan')
    expect(markdown).toContain('# Set up Supabase in my Vite + React app')
    expect(markdown).toContain('- Tooling: Codex plugin (MCP + skills), Supabase CLI')
    expect(markdown).toContain('- Environment: local Supabase stack (Docker)')
  })

  it('normalizes invalid query params back to defaults', () => {
    const markdown = buildStartAgentMarkdown(
      new URL(
        'https://supabase.com/docs/start?framework=unknown&primitives=missing&templates=not-real'
      )
    )

    expect(markdown).toContain('- Framework: Next.js (App Router)')
    expect(markdown).toContain('- Services: Database, Auth')
    expect(markdown).toContain('- Agent: Claude Code')
    expect(markdown).toContain('- Explicit template IDs: todos')
    expect(markdown).toContain(
      '/docs/start?project=new&framework=nextjs&shadcn=true&primitives=database,auth&orm=none&connection=remote&agent=claude&templates=todos'
    )
  })
})

describe('buildStartAgentHtml', () => {
  it('escapes markdown content before embedding it in crawler HTML', () => {
    const html = buildStartAgentHtml('# Title <script>alert("x")</script>')

    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert("x")</script>')
  })
})
