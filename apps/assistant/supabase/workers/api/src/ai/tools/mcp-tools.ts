import { createMCPClient } from '@ai-sdk/mcp'
import type { Tool, ToolSet } from 'ai'

import { env } from '../../env.ts'
import {
  ASSISTANT_MCP_TOOLS,
  canShareAssistantData,
  type ProjectPermissionLevel,
} from '../../permissions'
import { annotateMcpToolError, type McpToolResult } from './mcp-tools.utils.ts'

const SOURCE_NAME = 'supabase-assistant'

/**
 * Harness-owned: the assistant ships its own approval-gated versions of these
 * (see `project-tools.ts`), so the MCP server's copies are dropped here and the
 * harness copies win in `getTools`. Everything else comes from MCP.
 */
export const UI_EXECUTED_TOOLS = ['execute_sql', 'deploy_edge_function'] as const

/**
 * The MCP server rejected the OAuth token outright (HTTP 401). The token was
 * issued by a different platform than `MCP_URL`, or was revoked. Callers turn
 * this into `409 oauth_required` so Studio shows the reconnect banner instead
 * of the model reporting that tools are missing.
 */
export class McpUnauthorizedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'McpUnauthorizedError'
  }
}

export function getRemoteMcpUrl(projectRef: string) {
  const url = new URL(env.mcpUrl)
  if (projectRef) {
    url.searchParams.set('project_ref', projectRef)
  }
  url.searchParams.set('read_only', 'true')
  return url.toString()
}

async function createSupabaseMCPClient({
  oauthToken,
  projectRef,
  signal,
}: {
  oauthToken: string
  projectRef: string
  signal: AbortSignal
}) {
  const url = getRemoteMcpUrl(projectRef)
  try {
    return await createMCPClient({
      name: SOURCE_NAME,
      transport: {
        type: 'http',
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.any([
              signal,
              AbortSignal.timeout(30000),
              ...(init?.signal ? [init.signal] : []),
            ]),
          }),
        url,
        headers: {
          Authorization: `Bearer ${oauthToken}`,
          'x-source-name': SOURCE_NAME,
        },
      },
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    const host = new URL(url).host
    if (/\b401\b/.test(reason)) {
      throw new McpUnauthorizedError(
        `The Supabase MCP server at ${host} rejected the OAuth token (401). The token was not ` +
          `issued by this platform — MANAGEMENT_API_URL and MCP_URL must point at the platform ` +
          `Studio is using — or it was revoked. The organization must be reconnected.`,
        { cause: error }
      )
    }
    throw new Error(
      `Failed to connect to the Supabase MCP server at ${host} for project '${projectRef}': ${reason}`,
      { cause: error }
    )
  }
}

/**
 * `@ai-sdk/mcp` returns `isError` results to the model verbatim. Wrap each
 * tool so permission errors carry the platform / organization context the
 * server's message omits.
 */
function withAnnotatedErrors(
  tools: ToolSet,
  context: { projectRef: string; mcpUrl: string }
): ToolSet {
  const wrapped: ToolSet = {}
  for (const [name, tool] of Object.entries(tools)) {
    const execute = tool.execute
    if (!execute) {
      wrapped[name] = tool
      continue
    }
    wrapped[name] = {
      ...tool,
      execute: async (input, options) => {
        const result = await execute(input, options)
        return annotateMcpToolError(result as McpToolResult, context)
      },
    } as Tool
  }
  return wrapped
}

export const getMcpTools = async ({
  oauthToken,
  projectRef,
  signal,
  aiOptInLevel,
}: {
  oauthToken: string
  projectRef: string
  signal: AbortSignal
  aiOptInLevel: ProjectPermissionLevel
}) => {
  const mcpClient = await createSupabaseMCPClient({
    oauthToken,
    projectRef,
    signal,
  })

  let closing: Promise<void> | undefined
  const closeClient = () => {
    signal.removeEventListener('abort', onAbort)
    return (closing ??= mcpClient.close().catch(() => {}))
  }
  const onAbort = () => {
    void closeClient()
  }
  if (signal.aborted) {
    await closeClient()
    signal.throwIfAborted()
  }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    // The MCP SDK's result union includes provider tools; this transport returns dynamic function tools.
    const available = (await mcpClient.tools()) as ToolSet
    const tools: ToolSet = {}
    for (const [name, minimum] of Object.entries(ASSISTANT_MCP_TOOLS)) {
      const tool = available[name]
      if (!tool) {
        console.error(`MCP capability unavailable: ${name}`)
        continue
      }
      tools[name] = canShareAssistantData(aiOptInLevel, minimum)
        ? tool
        : {
            ...tool,
            execute: async () => ({
              message: 'This tool requires additional Assistant project data sharing permission.',
            }),
            toModelOutput: undefined,
          }
    }
    return {
      tools: withAnnotatedErrors(tools, { projectRef, mcpUrl: env.mcpUrl }),
      close: closeClient,
    }
  } catch (error) {
    await closeClient()
    throw error
  }
}
