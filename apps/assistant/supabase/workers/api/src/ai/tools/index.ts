import type { ToolSet } from 'ai'

import { executeOnce } from '../../db/tool-executions'
import type { ProjectPermissionLevel } from '../../permissions'
import { getIncidentTools } from './incident-tools'
import { getMcpTools, McpUnauthorizedError } from './mcp-tools'
import { getProjectTools, type ManagementApi } from './project-tools'
import { getSchemaTools } from './schema-tools'
import { getSupportLifecycleTools } from './support-tools'

export type { ManagementApi }

export async function getTools({
  projectRef,
  oauthToken,
  managementApi,
  supportMode,
  signal,
  aiOptInLevel,
  conversationId,
}: {
  projectRef: string
  oauthToken: string
  managementApi: ManagementApi
  supportMode?: boolean
  signal: AbortSignal
  aiOptInLevel: ProjectPermissionLevel
  conversationId: string
}) {
  let mcp = { tools: {} as ToolSet, close: async () => {} }
  try {
    mcp = await getMcpTools({ oauthToken, projectRef, signal, aiOptInLevel })
  } catch (error) {
    if (error instanceof McpUnauthorizedError) throw error
    signal.throwIfAborted()
    console.error('MCP tools unavailable', error)
  }
  const tools: ToolSet = {
    ...mcp.tools,
    ...getProjectTools({
      managementApi,
      aiOptInLevel,
      executeOperation: (id, name, input, execute) =>
        executeOnce(conversationId, id, name, input, execute),
    }),
    ...(aiOptInLevel !== 'disabled' ? getSchemaTools({ managementApi }) : {}),
    ...getIncidentTools(),
    ...(supportMode ? getSupportLifecycleTools() : {}),
  }
  return { tools, close: mcp.close }
}
