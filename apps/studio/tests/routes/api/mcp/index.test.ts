import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { Route } from '@/routes/api/mcp/index'
import { mswServer } from '@/tests/lib/msw'

const NOTEBOOK_TOOLS = [
  'create_notebook',
  'list_notebooks',
  'get_notebook',
  'run_notebook',
  'delete_notebook',
]

async function mcpRequest(method: string, params: Record<string, unknown> = {}) {
  const handlers = Route.options.server?.handlers as {
    POST: (ctx: { request: Request }) => Promise<Response>
  }
  const response = await handlers.POST({
    request: new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
  })
  return response.json()
}

describe('self-hosted /api/mcp notebooks', () => {
  beforeEach(() => {
    // `search_docs` loads the docs GraphQL schema while listing tools.
    mswServer.use(
      http.get('https://supabase.com/docs/api/graphql', () =>
        HttpResponse.json({ data: { schema: 'type Query { ping: String }' } })
      )
    )
  })

  it('does not list notebook tools', async () => {
    const { result } = await mcpRequest('tools/list')
    const names: string[] = result.tools.map((tool: { name: string }) => tool.name)

    expect(names).toContain('execute_sql')
    expect(names.filter((name) => NOTEBOOK_TOOLS.includes(name))).toEqual([])
  })

  it.each(NOTEBOOK_TOOLS)('refuses to call %s', async (name) => {
    const body = await mcpRequest('tools/call', { name, arguments: {} })

    expect(body.result?.isError ?? true).toBe(true)
    expect(JSON.stringify(body)).toMatch(/not found|unknown tool/i)
  })
})
