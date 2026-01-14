import type { ToolSet } from 'ai'
// End of third-party imports

import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { createSupabaseMCPClient } from '../supabase-mcp'
import { filterToolsByOptInLevel, toolSetValidationSchema } from '../tool-filter'

const UI_EXECUTED_TOOLS = ['execute_sql', 'deploy_edge_function']

export const getMcpTools = async ({
  accessToken,
  projectRef,
  aiOptInLevel,
}: {
  accessToken: string
  projectRef: string
  aiOptInLevel: AiOptInLevel
}) => {
  // If platform, fetch MCP client and tools which replace old local tools
  const mcpClient = await createSupabaseMCPClient({
    accessToken,
    projectId: projectRef,
  })

  const availableMcpTools = (await mcpClient.tools()) as ToolSet
  // Filter tools based on the (potentially modified) AI opt-in level
  const allowedMcpTools = filterToolsByOptInLevel(availableMcpTools, aiOptInLevel)

  // Remove UI-executed tools handled locally
  const filteredMcpTools: ToolSet = { ...allowedMcpTools }
  UI_EXECUTED_TOOLS.forEach((toolName) => {
    delete filteredMcpTools[toolName]
  })

  // Validate that only known tools are provided
  const validation = toolSetValidationSchema.safeParse(filteredMcpTools)
  if (!validation.success) {
    console.error('MCP tools validation error:', validation.error)
    throw new Error('Internal error: MCP tools validation failed')
  }

  return validation.data
}
