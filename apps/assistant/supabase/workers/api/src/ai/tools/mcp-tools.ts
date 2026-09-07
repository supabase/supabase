import { createMcpConnections, type McpConnectionDefinition } from '@supabase/agent-runtime/mcp'
import type { Tool, ToolSet } from 'ai'

import { env } from '../../env'
import { ASSISTANT_MCP_TOOLS } from '../../permissions'
import { annotateMcpToolError, type McpToolResult } from './mcp-tools.utils'

const SOURCE_NAME = 'supabase-assistant'
type ConnectionContext = { oauthToken: string; projectRef: string }

export function getRemoteMcpUrl(projectRef: string) {
  const url = new URL(env.mcpUrl)
  if (projectRef) {
    url.searchParams.set('project_ref', projectRef)
  }
  url.searchParams.set('read_only', 'true')
  return url.toString()
}

/** Product credentials and capabilities; transport and lifecycle belong to the runtime. */
export const assistantMcpConnections: readonly McpConnectionDefinition<ConnectionContext>[] = [
  {
    name: SOURCE_NAME,
    failure: 'optional',
    allowlist: Object.keys(ASSISTANT_MCP_TOOLS),
    aliases: Object.fromEntries(Object.keys(ASSISTANT_MCP_TOOLS).map((name) => [name, name])),
    transport: ({ oauthToken, projectRef }) => ({
      type: 'http',
      url: getRemoteMcpUrl(projectRef),
      headers: { Authorization: `Bearer ${oauthToken}`, 'x-source-name': SOURCE_NAME },
    }),
  },
]

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

export async function getMcpTools({
  signal,
  ...context
}: ConnectionContext & { signal: AbortSignal }) {
  const resources = await createMcpConnections(assistantMcpConnections, {
    context,
    abortSignal: signal,
    onError: (error) =>
      console.error('MCP capability unavailable', error.code, error.connectionName),
  })
  return {
    tools: withAnnotatedErrors(resources.tools, {
      projectRef: context.projectRef,
      mcpUrl: env.mcpUrl,
    }),
    close: resources.close,
  }
}
