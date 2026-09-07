import { UnauthorizedError, type MCPClientConfig } from '@ai-sdk/mcp'
import { jsonSchema, type ToolSet } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import {
  createMcpConnections,
  McpConnectionError,
  type McpConnectionClient,
  type McpConnectionDefinition,
  type McpConnectionTransport,
} from './mcp'

const executionOptions = { toolCallId: 'call-1', messages: [], context: undefined }
const definition = (
  name: string,
  overrides: Partial<McpConnectionDefinition<string>> = {}
): McpConnectionDefinition<string> => ({
  name,
  transport: (token) => ({
    type: 'http',
    url: 'https://mcp.example',
    headers: { Authorization: `Bearer ${token}` },
  }),
  ...overrides,
})

function client(tools: ToolSet = { search: remoteTool() }) {
  return { tools: vi.fn(async () => tools), close: vi.fn(async () => {}) }
}

function remoteTool(
  execute = vi.fn(async () => ({ content: [{ type: 'text', text: 'Result' }] }))
) {
  return { inputSchema: jsonSchema({ type: 'object' }), execute }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('createMcpConnections', () => {
  it('resolves fresh request credentials and disables SDK execution retries', async () => {
    const firstClient = client()
    const secondClient = client()
    const createClient = vi
      .fn<(config: MCPClientConfig) => Promise<McpConnectionClient>>()
      .mockResolvedValueOnce(firstClient)
      .mockResolvedValueOnce(secondClient)
    const transport = vi.fn(
      async (token: string): Promise<McpConnectionTransport> => ({
        type: 'http',
        url: `https://mcp.example/${token}`,
        headers: { Authorization: `Bearer ${token}` },
      })
    )
    const definitions = [definition('docs', { transport })]

    const first = await createMcpConnections(definitions, { context: 'first', createClient })
    const second = await createMcpConnections(definitions, { context: 'second', createClient })

    expect(transport).toHaveBeenCalledTimes(2)
    expect(createClient.mock.calls.map(([config]) => config.transport)).toMatchObject([
      {
        type: 'http',
        url: 'https://mcp.example/first',
        headers: { Authorization: 'Bearer first' },
      },
      {
        type: 'http',
        url: 'https://mcp.example/second',
        headers: { Authorization: 'Bearer second' },
      },
    ])
    expect(createClient.mock.calls[0][0]).toMatchObject({
      clientName: 'docs',
      maxRetries: 0,
      initializationOptions: { signal: expect.any(AbortSignal) },
    })
    expect(Object.keys(first.tools)).toEqual(['docs__search'])
    await first.close()
    expect(firstClient.close).toHaveBeenCalledOnce()
    expect(secondClient.close).not.toHaveBeenCalled()
    await second.close()
  })

  it('filters tools and applies exact aliases and custom namespaces without changing remote execution', async () => {
    const execute = vi.fn(async () => ({ ok: true }))
    const connected = client({
      search: { inputSchema: jsonSchema({ type: 'object' }), execute },
      details: remoteTool(),
      remove: remoteTool(),
    })
    const resources = await createMcpConnections(
      [
        definition('docs', {
          namespace: 'knowledge',
          allowlist: ['search', 'details'],
          aliases: { search: 'search_docs' },
        }),
      ],
      { context: '', createClient: async () => connected }
    )

    expect(Object.keys(resources.tools)).toEqual(['search_docs', 'knowledge__details'])
    await expect(
      resources.tools.search_docs.execute!({ query: 'sql' }, executionOptions)
    ).resolves.toEqual({ ok: true })
    expect(execute).toHaveBeenCalledWith(
      { query: 'sql' },
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
    await resources.close()
  })

  it('handles prototype-like aliases as own tools', async () => {
    const resources = await createMcpConnections(
      [definition('docs', { aliases: { search: '__proto__' } })],
      { context: '', createClient: async () => client() }
    )

    expect(Object.hasOwn(resources.tools, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(resources.tools)).toBe(Object.prototype)
    await resources.close()
  })

  it('rejects duplicate connection names before creating clients', async () => {
    const createClient = vi.fn(async () => client())
    await expect(
      createMcpConnections([definition('docs'), definition('docs')], {
        context: '',
        createClient,
      })
    ).rejects.toMatchObject({ code: 'configuration_error' })
    expect(createClient).not.toHaveBeenCalled()
  })

  it('rejects cross-connection alias collisions even for optional connections and closes every client', async () => {
    const first = client()
    const second = client()
    const createClient = vi
      .fn<(config: MCPClientConfig) => Promise<McpConnectionClient>>()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)

    await expect(
      createMcpConnections(
        [
          definition('first', { aliases: { search: 'search' } }),
          definition('second', { aliases: { search: 'search' }, failure: 'optional' }),
        ],
        { context: '', createClient }
      )
    ).rejects.toMatchObject({ code: 'configuration_error', toolName: 'search' })
    expect(first.close).toHaveBeenCalledOnce()
    expect(second.close).toHaveBeenCalledOnce()
  })

  it('rejects colliding aliases within a connection without publishing a partial tool set', async () => {
    const connected = client({ first: remoteTool(), second: remoteTool() })
    await expect(
      createMcpConnections(
        [definition('docs', { aliases: { first: 'search', second: 'search' } })],
        { context: '', createClient: async () => connected }
      )
    ).rejects.toMatchObject({ code: 'configuration_error' })
    expect(connected.close).toHaveBeenCalledOnce()
  })

  it('omits optional discovery failures and reports sanitized diagnostics', async () => {
    const failed = client()
    failed.tools.mockRejectedValue(
      new Error('https://secret.example?token=private Authorization: sensitive')
    )
    const available = client()
    const createClient = vi
      .fn<(config: MCPClientConfig) => Promise<McpConnectionClient>>()
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce(available)
    const onError = vi.fn()

    const resources = await createMcpConnections(
      [definition('optional', { failure: 'optional' }), definition('available')],
      { context: '', createClient, onError }
    )

    expect(Object.keys(resources.tools)).toEqual(['available__search'])
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'discovery_failed', connectionName: 'optional' })
    )
    const reported = onError.mock.calls[0][0]
    expect(reported.message).not.toMatch(/secret|private|Authorization|sensitive/)
    expect(reported.cause).toBeUndefined()
    expect(failed.close).toHaveBeenCalledOnce()
    await resources.close()
    expect(failed.close).toHaveBeenCalledOnce()
    expect(available.close).toHaveBeenCalledOnce()
  })

  it('fails required discovery and cleans up partial startup', async () => {
    const first = client()
    const failed = client()
    failed.tools.mockRejectedValue(new Error('Tool discovery unavailable'))
    const createClient = vi
      .fn<(config: MCPClientConfig) => Promise<McpConnectionClient>>()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(failed)

    await expect(
      createMcpConnections([definition('first'), definition('failed')], {
        context: '',
        createClient,
      })
    ).rejects.toMatchObject({ code: 'discovery_failed', connectionName: 'failed' })
    expect(first.close).toHaveBeenCalledOnce()
    expect(failed.close).toHaveBeenCalledOnce()
  })

  it.each([
    new UnauthorizedError(),
    Object.assign(new Error('Unauthorized'), { statusCode: 401 }),
    new Error('Wrapped', { cause: Object.assign(new Error('Unauthorized'), { status: 401 }) }),
  ])('never downgrades an authorization failure during startup', async (failure) => {
    const first = client()
    const createClient = vi
      .fn<(config: MCPClientConfig) => Promise<McpConnectionClient>>()
      .mockResolvedValueOnce(first)
      .mockRejectedValueOnce(failure)

    await expect(
      createMcpConnections([definition('first'), definition('expired', { failure: 'optional' })], {
        context: '',
        createClient,
      })
    ).rejects.toMatchObject({ code: 'authorization_required', connectionName: 'expired' })
    expect(first.close).toHaveBeenCalledOnce()
  })

  it('preserves typed execution failures, reports them, and never retries a call', async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('Connection dropped with secret URL'))
      .mockRejectedValueOnce(Object.assign(new Error('Expired token'), { statusCode: 401 }))
    const connected = client({ search: { inputSchema: jsonSchema({ type: 'object' }), execute } })
    const onError = vi.fn()
    const resources = await createMcpConnections([definition('docs')], {
      context: '',
      createClient: async () => connected,
      onError,
    })

    await expect(resources.tools.docs__search.execute!({}, executionOptions)).rejects.toMatchObject(
      {
        code: 'execution_failed',
        connectionName: 'docs',
        toolName: 'search',
      }
    )
    expect(execute).toHaveBeenCalledOnce()
    await expect(resources.tools.docs__search.execute!({}, executionOptions)).rejects.toMatchObject(
      {
        code: 'authorization_required',
        connectionName: 'docs',
        toolName: 'search',
      }
    )
    expect(execute).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(McpConnectionError)
    await resources.close()
  })

  it('preserves MCP error results for the model and reports execution failure', async () => {
    const output = { isError: true, content: [{ type: 'text', text: 'Record does not exist' }] }
    const connected = client({
      search: { inputSchema: jsonSchema({ type: 'object' }), execute: vi.fn(async () => output) },
    })
    const onError = vi.fn()
    const resources = await createMcpConnections([definition('docs')], {
      context: '',
      createClient: async () => connected,
      onError,
    })
    await expect(resources.tools.docs__search.execute!({}, executionOptions)).resolves.toBe(output)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'execution_failed' }))
    await resources.close()
  })

  it('closes once after cancellation and prevents subsequent tool execution', async () => {
    const connected = client()
    const controller = new AbortController()
    const resources = await createMcpConnections([definition('docs')], {
      context: '',
      createClient: async () => connected,
      abortSignal: controller.signal,
    })
    controller.abort()
    const closing = resources.close()
    expect(resources.close()).toBe(closing)
    await closing
    expect(connected.close).toHaveBeenCalledOnce()
    await expect(resources.tools.docs__search.execute!({}, executionOptions)).rejects.toMatchObject(
      { name: 'AbortError' }
    )
  })

  it('cancels discovery promptly and closes its client even when discovery ignores abort', async () => {
    const pending = deferred<ToolSet>()
    const started = deferred<void>()
    const connected = client()
    connected.tools.mockImplementation(() => {
      started.resolve()
      return pending.promise
    })
    const controller = new AbortController()
    const initializing = createMcpConnections([definition('docs', { failure: 'optional' })], {
      context: '',
      createClient: async () => connected,
      abortSignal: controller.signal,
    })
    const rejected = expect(initializing).rejects.toMatchObject({ name: 'AbortError' })
    await started.promise
    controller.abort()
    await rejected
    expect(connected.close).toHaveBeenCalledOnce()
    pending.resolve({})
  })

  it('closes a client whose factory resolves after cancellation', async () => {
    const pending = deferred<McpConnectionClient>()
    const started = deferred<void>()
    const connected = client()
    const controller = new AbortController()
    const initializing = createMcpConnections([definition('docs')], {
      context: '',
      abortSignal: controller.signal,
      createClient: () => {
        started.resolve()
        return pending.promise
      },
    })
    const rejected = expect(initializing).rejects.toMatchObject({ name: 'AbortError' })
    await started.promise
    controller.abort()
    await rejected
    pending.resolve(connected)
    await vi.waitFor(() => expect(connected.close).toHaveBeenCalledOnce())
    expect(connected.tools).not.toHaveBeenCalled()
  })

  it('does not initialize an already cancelled request', async () => {
    const createClient = vi.fn(async () => client())
    await expect(
      createMcpConnections([definition('docs')], {
        context: '',
        createClient,
        abortSignal: AbortSignal.abort(),
      })
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(createClient).not.toHaveBeenCalled()
  })

  it.each([0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid request timeout before initialization: %s',
    async (requestTimeoutMs) => {
      const createClient = vi.fn(async () => client())
      await expect(
        createMcpConnections([definition('docs', { requestTimeoutMs })], {
          context: '',
          createClient,
        })
      ).rejects.toMatchObject({ code: 'configuration_error' })
      expect(createClient).not.toHaveBeenCalled()
    }
  )

  it('keeps an established inbound SSE stream open until the session closes', async () => {
    vi.useFakeTimers()
    let inboundSignal: AbortSignal | undefined
    let resources: Awaited<ReturnType<typeof createMcpConnections>> | undefined
    try {
      resources = await createMcpConnections(
        [
          definition('docs', {
            requestTimeoutMs: 10,
            transport: () => ({
              type: 'sse',
              url: 'https://mcp.example',
              fetch: async (_input, init) => {
                inboundSignal = init!.signal!
                return new Response(new ReadableStream(), {
                  headers: { 'Content-Type': 'text/event-stream' },
                })
              },
            }),
          }),
        ],
        {
          context: '',
          createClient: async (config) => {
            const transport = config.transport as McpConnectionTransport
            await transport.fetch!('https://mcp.example', {
              headers: { Accept: 'text/event-stream' },
            })
            return client()
          },
        }
      )
      await vi.advanceTimersByTimeAsync(100)
      expect(inboundSignal?.aborted).toBe(false)
      await resources.close()
      expect(inboundSignal?.aborted).toBe(true)
    } finally {
      await resources?.close()
      vi.useRealTimers()
    }
  })

  it('bounds an inbound SSE connection that never receives headers', async () => {
    vi.useFakeTimers()
    const started = deferred<void>()
    try {
      const initializing = createMcpConnections(
        [
          definition('docs', {
            requestTimeoutMs: 10,
            transport: () => ({
              type: 'sse',
              url: 'https://mcp.example',
              fetch: async (_input, init) => {
                started.resolve()
                const signal = init!.signal!
                return new Promise((_resolve, reject) => {
                  signal.addEventListener('abort', () => reject(signal.reason), { once: true })
                })
              },
            }),
          }),
        ],
        {
          context: '',
          createClient: async (config) => {
            const transport = config.transport as McpConnectionTransport
            await transport.fetch!('https://mcp.example', { method: 'GET' })
            return client()
          },
        }
      )
      const rejected = expect(initializing).rejects.toMatchObject({ code: 'discovery_failed' })
      await started.promise
      await vi.advanceTimersByTimeAsync(10)
      await rejected
    } finally {
      vi.useRealTimers()
    }
  })

  it('bounds termination requests after cancellation without skipping the DELETE', async () => {
    const signals: AbortSignal[] = []
    const fetch: NonNullable<McpConnectionTransport['fetch']> = async (_input, init) => {
      const signal = init!.signal!
      signals.push(signal)
      expect(init?.method).toBe('DELETE')
      expect(signal.aborted).toBe(false)
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      })
    }
    const resources = await createMcpConnections(
      [
        definition('docs', {
          requestTimeoutMs: 10,
          transport: () => ({ type: 'sse', url: 'https://mcp.example', fetch }),
        }),
      ],
      {
        context: '',
        createClient: async (config) => ({
          tools: async () => ({}),
          close: async () => {
            const transport = config.transport as McpConnectionTransport
            await transport.fetch!('https://mcp.example', { method: 'DELETE' })
          },
        }),
      }
    )
    await expect(resources.close()).rejects.toMatchObject({ code: 'cleanup_failed' })
    expect(signals).toHaveLength(1)
    expect(signals[0].reason).toMatchObject({ name: 'TimeoutError' })
  })

  it('attempts every close exactly once when a client cleanup fails', async () => {
    const failed = client()
    failed.close.mockRejectedValue(new Error('Cleanup URL contains a secret'))
    const other = client()
    const createClient = vi
      .fn<(config: MCPClientConfig) => Promise<McpConnectionClient>>()
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce(other)
    const resources = await createMcpConnections([definition('first'), definition('other')], {
      context: '',
      createClient,
    })
    await expect(resources.close()).rejects.toMatchObject({
      code: 'cleanup_failed',
      connectionName: 'first',
    })
    await expect(resources.close()).rejects.toMatchObject({ code: 'cleanup_failed' })
    expect(failed.close).toHaveBeenCalledOnce()
    expect(other.close).toHaveBeenCalledOnce()
  })

  it('uses the real SDK transport and identifies a 401 without exposing its response body', async () => {
    const fetch = vi.fn<NonNullable<McpConnectionTransport['fetch']>>(
      async () => new Response('secret upstream response', { status: 401 })
    )
    const onError = vi.fn()
    await expect(
      createMcpConnections(
        [
          definition('docs', {
            transport: () => ({ type: 'http', url: 'https://mcp.example?token=secret', fetch }),
            failure: 'optional',
          }),
        ],
        { context: '', onError }
      )
    ).rejects.toMatchObject({ code: 'authorization_required', connectionName: 'docs' })
    // Streamable HTTP also opens an inbound GET; initialization itself is not retried.
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
    expect(onError.mock.calls[0][0].message).not.toContain('secret')
  })
})
