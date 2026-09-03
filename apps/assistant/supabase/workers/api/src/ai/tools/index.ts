import type { ToolSet } from 'ai'

import { getIncidentTools } from './incident-tools'
import { getMcpTools, McpUnauthorizedError } from './mcp-tools'
import { getProjectTools, type ManagementApi } from './project-tools'
import { getSchemaTools } from './schema-tools'
import { getSupportLifecycleTools } from './support-tools'

export type { ManagementApi }

export const getTools = async ({
  projectRef,
  oauthToken,
  managementApi,
  supportMode,
  signal,
}: {
  projectRef: string
  oauthToken: string
  managementApi: ManagementApi
  supportMode?: boolean
  signal: AbortSignal
}) => {
  // The Supabase MCP server is the base tool surface, exactly as it is for any
  // other agent harness. Harness-owned tools are spread after it so they
  // override same-named MCP tools (approval-gated `execute_sql`, ...) and add
  // what MCP does not offer (`rename_chat`, `load_knowledge`, `list_policies`).
  let mcpTools: ToolSet = {}
  try {
    mcpTools = await getMcpTools({
      oauthToken,
      projectRef,
      signal,
    })
  } catch (error) {
    // A rejected token is not something to degrade around: without MCP the
    // assistant is blind, and the user needs to reconnect. Let the route map it.
    if (error instanceof McpUnauthorizedError) throw error
    console.error('Failed to fetch MCP tools; continuing with harness tools only.', error)
  }

  const tools: ToolSet = {
    ...mcpTools,
    ...getProjectTools({ projectRef, oauthToken, managementApi }),
    ...getSchemaTools({ managementApi }),
    ...getIncidentTools(),
  }

  return supportMode ? { ...tools, ...getSupportLifecycleTools() } : tools
}
