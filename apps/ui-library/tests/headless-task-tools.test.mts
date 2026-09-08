// Copied beside the assembled Edge Function by scripts/test-headless-tools.mts.
// Real MCP input validation and Supabase queries run against an in-memory HTTP fixture.
import assert from 'node:assert/strict'
import { createMcpHandler, McpServer } from 'npm:@modelcontextprotocol/server@2.0.0'
import { createClient } from 'npm:@supabase/supabase-js@2.108.2'

import { registerTools, type ToolContext } from './tools/index.ts'

const id = 'ab4cbbf1-f726-4bf4-b852-684f21f470ae'
const task = { id, title: 'Try task tools', closed: false, created_at: '2026-01-01T00:00:00Z' }

function fixture(data: unknown = [], status = 200) {
  const requests: Request[] = []
  const supabase = createClient('http://supabase.test', 'test-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: { Authorization: 'Bearer caller-token' },
      fetch: (input, init) => {
        requests.push(new Request(input, init))
        return Promise.resolve(Response.json(data, { status }))
      },
    },
  })
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: 'headless-test', version: '1.0.0' })
    registerTools(server, {
      supabase,
      userClaims: { id, role: 'authenticated' } as ToolContext['userClaims'],
      jwtClaims: { sub: id, client_id: 'agent-client' } as ToolContext['jwtClaims'],
    })
    return server
  })

  async function rpc(method: string, params: Record<string, unknown>) {
    const response = await handler.fetch(
      new Request('http://mcp.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-11-25',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      })
    )
    const text = await response.text()
    assert.equal(response.status, 200, text)
    const json = response.headers.get('content-type')?.includes('text/event-stream')
      ? text
          .split('\n')
          .find((line) => line.startsWith('data: '))!
          .slice(6)
      : text
    const message = JSON.parse(json)
    assert.equal(message.error, undefined, json)
    return message.result
  }

  return {
    requests,
    rpc,
    call: (name: string, args: Record<string, unknown> = {}) =>
      rpc('tools/call', { name, arguments: args }),
    close: handler.close,
  }
}

Deno.test(
  'assembled server exposes identity and all four task tools with side-effect hints',
  async () => {
    const app = fixture()
    try {
      const { tools } = await app.rpc('tools/list', {})
      assert.deepEqual(tools.map((tool: { name: string }) => tool.name).sort(), [
        'create_task',
        'delete_task',
        'list_tasks',
        'update_task',
        'whoami',
      ])
      const byName = Object.fromEntries(tools.map((tool: { name: string }) => [tool.name, tool]))
      assert.equal(byName.list_tasks.annotations.readOnlyHint, true)
      assert.equal(byName.create_task.annotations.idempotentHint, false)
      assert.equal(byName.delete_task.annotations.destructiveHint, true)
      const identity = await app.call('whoami')
      assert.equal(identity.structuredContent.client_id, 'agent-client')
      assert.equal(app.requests.length, 0)
    } finally {
      await app.close()
    }
  }
)

Deno.test('create trims the title and sends only it through the caller-scoped client', async () => {
  const app = fixture(task)
  try {
    const result = await app.call('create_task', { title: '  Try task tools  ' })
    assert.deepEqual(result.structuredContent, { task })
    assert.equal(app.requests.length, 1)
    const [request] = app.requests
    assert.equal(request.method, 'POST')
    assert.equal(request.headers.get('authorization'), 'Bearer caller-token')
    assert.deepEqual(await request.json(), { title: task.title })
  } finally {
    await app.close()
  }
})

Deno.test('invalid inputs fail MCP validation before any database request', async () => {
  const app = fixture()
  try {
    for (const [name, args] of [
      ['create_task', { title: ' \t\n ' }],
      ['create_task', { title: 'x'.repeat(201) }],
      ['create_task', { title: 'Spoof owner', user_id: id }],
      ['update_task', { id }],
      ['update_task', { id, closed: 'true' }],
      ['update_task', { id, closed: false, user_id: id }],
      ['delete_task', { id: 'invalid' }],
      ['list_tasks', { limit: 101 }],
      ['list_tasks', { offset: -1 }],
    ] as const) {
      const result = await app.call(name, args)
      assert.equal(result.isError, true, `${name}: ${JSON.stringify(args)}`)
    }
    assert.equal(app.requests.length, 0)
  } finally {
    await app.close()
  }
})

Deno.test(
  'list filters open tasks and returns a bounded page with a continuation offset',
  async () => {
    const app = fixture([task, { ...task, id: 'extra-row' }])
    try {
      const result = await app.call('list_tasks', { closed: false, limit: 1, offset: 3 })
      assert.deepEqual(result.structuredContent, { tasks: [task], next_offset: 4 })
      const url = new URL(app.requests[0].url)
      assert.equal(url.pathname, '/rest/v1/tasks')
      assert.equal(url.searchParams.get('closed'), 'eq.false')
      assert.equal(url.searchParams.get('order'), 'created_at.desc,id.desc')
      assert.equal(url.searchParams.get('offset'), '3')
      assert.equal(url.searchParams.get('limit'), '2')
    } finally {
      await app.close()
    }
  }
)

Deno.test('list supplies defaults and an empty final page', async () => {
  const app = fixture([])
  try {
    const result = await app.call('list_tasks')
    assert.deepEqual(result.structuredContent, { tasks: [], next_offset: null })
    const url = new URL(app.requests[0].url)
    assert.equal(url.searchParams.get('limit'), '21')
    assert.equal(url.searchParams.get('offset'), '0')
    assert.equal(url.searchParams.has('closed'), false)
  } finally {
    await app.close()
  }
})

Deno.test('update preserves omitted fields and supports reopening a task', async () => {
  const app = fixture([task])
  try {
    const result = await app.call('update_task', { id, closed: false })
    assert.deepEqual(result.structuredContent, { task })
    const [request] = app.requests
    assert.equal(request.method, 'PATCH')
    assert.equal(new URL(request.url).searchParams.get('id'), `eq.${id}`)
    assert.deepEqual(await request.json(), { closed: false })
  } finally {
    await app.close()
  }
})

Deno.test('delete returns the deleted ID and limits deletion to that ID', async () => {
  const app = fixture([{ id }])
  try {
    const result = await app.call('delete_task', { id })
    assert.deepEqual(result.structuredContent, { deleted: true, id })
    assert.equal(app.requests[0].method, 'DELETE')
    assert.equal(new URL(app.requests[0].url).searchParams.get('id'), `eq.${id}`)
  } finally {
    await app.close()
  }
})

Deno.test('mutations report an error when RLS hides the row or it does not exist', async () => {
  const app = fixture([])
  try {
    for (const name of ['update_task', 'delete_task']) {
      const result = await app.call(name, name === 'update_task' ? { id, closed: true } : { id })
      assert.equal(result.isError, true)
      assert.equal(result.content[0].text, 'Task not found or you do not have access.')
    }
  } finally {
    await app.close()
  }
})

Deno.test('database failures retain their actionable message and error code', async () => {
  const app = fixture(
    { code: '42501', message: 'permission denied for table tasks', hint: null },
    403
  )
  try {
    for (const [name, args] of [
      ['list_tasks', {}],
      ['create_task', { title: 'Test permissions' }],
      ['update_task', { id, closed: true }],
      ['delete_task', { id }],
    ] as const) {
      const result = await app.call(name, args)
      assert.equal(result.isError, true)
      assert.match(result.content[0].text, /\[42501\] permission denied for table tasks/)
    }
  } finally {
    await app.close()
  }
})

Deno.test(
  'OAuth discovery uses the public Edge gateway origin locally and when hosted',
  async () => {
    const { getPublicProjectUrl } = await import('./oauth.ts')
    const previous = Deno.env.get('SUPABASE_PUBLIC_URL')
    Deno.env.delete('SUPABASE_PUBLIC_URL')
    try {
      for (const [headers, expected] of [
        [
          {
            'x-forwarded-host': '127.0.0.1:54321',
            'x-forwarded-proto': 'http',
            'x-forwarded-port': '54321',
          },
          'http://127.0.0.1:54321',
        ],
        [
          {
            'x-forwarded-host': 'example.supabase.co',
            'x-forwarded-proto': 'https',
            'x-forwarded-port': '443',
          },
          'https://example.supabase.co',
        ],
        [
          {
            'x-forwarded-host': 'localhost',
            'x-forwarded-proto': 'http',
            'x-forwarded-port': '54321',
          },
          'http://localhost:54321',
        ],
        [{ 'x-forwarded-host': '[::1]:54321', 'x-forwarded-proto': 'http' }, 'http://[::1]:54321'],
      ] as const) {
        assert.equal(
          getPublicProjectUrl(new Request('http://edge-runtime:9000/mcp-server', { headers })),
          expected
        )
      }
      assert.equal(
        getPublicProjectUrl(new Request('https://example.supabase.co/mcp-server')),
        'https://example.supabase.co'
      )
      Deno.env.set('SUPABASE_PUBLIC_URL', 'https://custom.example.com/')
      assert.equal(
        getPublicProjectUrl(new Request('http://edge-runtime:9000/mcp-server')),
        'https://custom.example.com'
      )
    } finally {
      if (previous === undefined) Deno.env.delete('SUPABASE_PUBLIC_URL')
      else Deno.env.set('SUPABASE_PUBLIC_URL', previous)
    }
  }
)
