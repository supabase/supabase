import { createMCPClient, UnauthorizedError, type MCPClientConfig } from '@ai-sdk/mcp'
import type { Tool, ToolSet } from 'ai'

type SdkTransport = Extract<MCPClientConfig['transport'], { type: 'http' | 'sse' }>

export type McpConnectionTransport = Pick<
  SdkTransport,
  'type' | 'url' | 'headers' | 'fetch' | 'redirect'
>

export interface McpConnectionDefinition<Context> {
  readonly name: string
  readonly transport: (
    context: Context,
    options: { abortSignal: AbortSignal }
  ) => McpConnectionTransport | Promise<McpConnectionTransport>
  readonly allowlist?: readonly string[]
  /** Defaults to the connection name; tools are exposed as namespace__tool. */
  readonly namespace?: string
  /** Maps remote tool names to exact public names, bypassing the namespace. */
  readonly aliases?: Readonly<Record<string, string>>
  /** Bounds transport requests, including cleanup. Defaults to 30 seconds. */
  readonly requestTimeoutMs?: number
  /** Optional connections may be omitted after discovery failure. Authentication failures always reject. */
  readonly failure?: 'required' | 'optional'
}

export interface McpConnectionClient {
  tools: () => Promise<ToolSet>
  close: () => Promise<void>
}

export type McpConnectionErrorCode =
  | 'authorization_required'
  | 'discovery_failed'
  | 'execution_failed'
  | 'configuration_error'
  | 'cleanup_failed'

const ERROR_MESSAGES: Record<McpConnectionErrorCode, string> = {
  authorization_required: 'requires authorization',
  discovery_failed: 'could not discover tools',
  execution_failed: 'could not execute a tool',
  configuration_error: 'has invalid or conflicting tool configuration',
  cleanup_failed: 'could not close',
}

/** Safe to report without exposing upstream URLs, response bodies, or credentials. */
export class McpConnectionError extends Error {
  readonly code: McpConnectionErrorCode
  readonly connectionName: string
  readonly toolName?: string

  constructor(code: McpConnectionErrorCode, connectionName: string, toolName?: string) {
    super(`MCP connection "${connectionName}" ${ERROR_MESSAGES[code]}.`)
    this.name = 'McpConnectionError'
    this.code = code
    this.connectionName = connectionName
    this.toolName = toolName
  }
}

export interface McpConnectionsOptions<Context> {
  readonly context: Context
  readonly abortSignal?: AbortSignal
  /** Observes sanitized errors; observer failures do not change connection failure policy. */
  readonly onError?: (error: McpConnectionError) => void | Promise<void>
  readonly createClient?: (config: MCPClientConfig) => Promise<McpConnectionClient>
}

/** Resolves fresh credentials and creates clients for one agent session. */
export async function createMcpConnections<Context>(
  definitions: readonly McpConnectionDefinition<Context>[],
  options: McpConnectionsOptions<Context>
): Promise<{ tools: ToolSet; close: () => Promise<void> }> {
  const names = new Set<string>()
  for (const definition of definitions) {
    if (
      !isToolName(definition.name) ||
      names.has(definition.name) ||
      !isToolName(definition.namespace ?? definition.name) ||
      (definition.requestTimeoutMs !== undefined &&
        (!Number.isSafeInteger(definition.requestTimeoutMs) || definition.requestTimeoutMs <= 0)) ||
      (definition.failure !== undefined &&
        !['required', 'optional'].includes(definition.failure)) ||
      Object.values(definition.aliases ?? {}).some((name) => !isToolName(name))
    ) {
      throw new McpConnectionError('configuration_error', definition.name)
    }
    names.add(definition.name)
  }

  const controller = new AbortController()
  const signal = options.abortSignal
    ? AbortSignal.any([options.abortSignal, controller.signal])
    : controller.signal
  const clients: { close: () => Promise<void> }[] = []
  let closing: Promise<void> | undefined
  const report = async (error: McpConnectionError) => {
    try {
      await options.onError?.(error)
    } catch {
      // Observers cannot turn a required connection into an optional one or prevent cleanup.
    }
  }
  const close = () => {
    if (!closing) {
      signal.removeEventListener('abort', onAbort)
      closing = Promise.resolve().then(async () => {
        controller.abort()
        const results = await Promise.allSettled(clients.map((client) => client.close()))
        const failure = results.find((result) => result.status === 'rejected')
        if (failure?.status === 'rejected') throw failure.reason
      })
    }
    return closing
  }
  const onAbort = () => {
    void close().catch(() => {})
  }
  signal.addEventListener('abort', onAbort, { once: true })
  const createClient = options.createClient ?? createMCPClient
  const tools: ToolSet = {}

  try {
    signal.throwIfAborted()
    for (const definition of definitions) {
      let resource: McpConnectionClient | undefined
      try {
        const transport = await abortable(
          Promise.resolve(definition.transport(options.context, { abortSignal: signal })),
          signal
        )
        signal.throwIfAborted()
        if (!['http', 'sse'].includes(transport.type)) {
          throw new McpConnectionError('configuration_error', definition.name)
        }
        const requestFetch = transport.fetch ?? globalThis.fetch
        const requestTimeoutMs = definition.requestTimeoutMs ?? 30_000
        const initialized = createClient({
          clientName: definition.name,
          maxRetries: 0,
          initializationOptions: { signal, timeout: requestTimeoutMs },
          transport: {
            type: transport.type,
            url: transport.url,
            redirect: transport.redirect,
            headers: transport.headers ? { ...transport.headers } : undefined,
            fetch: async (input, init) => {
              const method = (
                init?.method ?? (input instanceof Request ? input.method : 'GET')
              ).toUpperCase()
              // Session termination must still reach the server after cancellation.
              const terminating = closing !== undefined && method === 'DELETE'
              // GET carries the long-lived inbound SSE stream. Bound connection setup,
              // then let session cancellation own its lifetime after headers arrive.
              const connectionTimeout = method === 'GET' ? new AbortController() : undefined
              const timeout = connectionTimeout
                ? setTimeout(
                    () =>
                      connectionTimeout.abort(
                        new DOMException('The operation timed out.', 'TimeoutError')
                      ),
                    requestTimeoutMs
                  )
                : undefined
              const signals = [
                connectionTimeout?.signal ?? AbortSignal.timeout(requestTimeoutMs),
                ...(!terminating ? [signal] : []),
                ...(input instanceof Request ? [input.signal] : []),
                ...(init?.signal ? [init.signal] : []),
              ]
              let response: Response
              try {
                response = await requestFetch(input, {
                  ...init,
                  signal: AbortSignal.any(signals),
                })
              } finally {
                if (timeout !== undefined) clearTimeout(timeout)
              }
              if (response.status === 401) {
                await response.body?.cancel().catch(() => {})
                throw new McpConnectionError('authorization_required', definition.name)
              }
              return response
            },
          },
        }).then((client) => {
          let clientClosing: Promise<void> | undefined
          const owned: McpConnectionClient = {
            tools: () => client.tools() as Promise<ToolSet>,
            close: () => {
              clientClosing ??= Promise.resolve()
                .then(() => client.close())
                .catch(async () => {
                  const error = new McpConnectionError('cleanup_failed', definition.name)
                  await report(error)
                  throw error
                })
              return clientClosing
            },
          }
          clients.push(owned)
          // A factory may resolve after cancellation, even if it ignored its signal.
          if (signal.aborted) void owned.close().catch(() => {})
          return owned
        })
        resource = await abortable(initialized, signal)
        const discovered = await abortable(resource.tools(), signal)
        signal.throwIfAborted()
        const allowlist = definition.allowlist ? new Set(definition.allowlist) : undefined
        const connectionTools: ToolSet = {}
        for (const [remoteName, discoveredTool] of Object.entries(discovered)) {
          if (allowlist && !allowlist.has(remoteName)) continue
          const publicName = Object.hasOwn(definition.aliases ?? {}, remoteName)
            ? definition.aliases![remoteName]
            : `${definition.namespace ?? definition.name}__${remoteName}`
          if (
            !isToolName(publicName) ||
            Object.hasOwn(tools, publicName) ||
            Object.hasOwn(connectionTools, publicName)
          ) {
            throw new McpConnectionError('configuration_error', definition.name, publicName)
          }
          Object.defineProperty(connectionTools, publicName, {
            enumerable: true,
            value: wrapTool(discoveredTool, definition.name, remoteName, signal, report),
          })
        }
        Object.defineProperties(tools, Object.getOwnPropertyDescriptors(connectionTools))
      } catch (error) {
        if (resource) await resource.close().catch(() => {})
        signal.throwIfAborted()
        const failure = connectionError(error, 'discovery_failed', definition.name)
        await report(failure)
        if (
          definition.failure !== 'optional' ||
          failure.code === 'authorization_required' ||
          failure.code === 'configuration_error'
        ) {
          throw failure
        }
      }
    }
    return { tools, close }
  } catch (error) {
    await close().catch(() => {})
    throw error
  }
}

function wrapTool(
  tool: Tool,
  connectionName: string,
  toolName: string,
  signal: AbortSignal,
  report: (error: McpConnectionError) => Promise<void>
): Tool {
  const execute = tool.execute
  if (!execute) return tool
  return {
    ...tool,
    execute: async (input, options) => {
      const executionSignal = options.abortSignal
        ? AbortSignal.any([signal, options.abortSignal])
        : signal
      executionSignal.throwIfAborted()
      try {
        const output = await execute(input, { ...options, abortSignal: executionSignal })
        if (
          typeof output === 'object' &&
          output !== null &&
          'isError' in output &&
          output.isError
        ) {
          await report(new McpConnectionError('execution_failed', connectionName, toolName))
        }
        return output
      } catch (error) {
        executionSignal.throwIfAborted()
        const failure = connectionError(error, 'execution_failed', connectionName, toolName)
        await report(failure)
        throw failure
      }
    },
  } as Tool
}

function isToolName(name: string): boolean {
  return name.length > 0 && !/[^a-zA-Z0-9_-]/.test(name)
}

function connectionError(
  error: unknown,
  fallback: McpConnectionErrorCode,
  connectionName: string,
  toolName?: string
): McpConnectionError {
  if (error instanceof McpConnectionError) {
    return toolName && !error.toolName
      ? new McpConnectionError(error.code, error.connectionName, toolName)
      : error
  }
  const seen = new Set<unknown>()
  let current = error
  while (typeof current === 'object' && current !== null && !seen.has(current)) {
    seen.add(current)
    if (
      current instanceof UnauthorizedError ||
      (current instanceof McpConnectionError && current.code === 'authorization_required') ||
      ('statusCode' in current && current.statusCode === 401) ||
      ('status' in current && current.status === 401)
    ) {
      return new McpConnectionError('authorization_required', connectionName, toolName)
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return new McpConnectionError(fallback, connectionName, toolName)
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) onAbort()
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}
