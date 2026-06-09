import { ToolSet } from 'ai'
import { IS_PLATFORM } from 'common'

import { filterToolsByOptInLevel } from '../tool-filter'
import { getFallbackTools } from './fallback-tools'
import { getIncidentTools } from './incident-tools'
import { getMcpTools } from './mcp-tools'
import { getSchemaTools } from './schema-tools'
import { getStudioTools } from './studio-tools'
import { getSupportLifecycleTools } from './support-tools'
import { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export const getTools = async ({
  projectRef,
  connectionString,
  authorization,
  aiOptInLevel,
  accessToken,
  baseUrl,
  supportMode,
}: {
  projectRef: string
  connectionString: string
  authorization?: string
  aiOptInLevel: AiOptInLevel
  accessToken?: string
  baseUrl?: string
  supportMode?: boolean
}) => {
  // Always include studio tools
  let tools: ToolSet = getStudioTools({ projectRef, connectionString, authorization, aiOptInLevel })

  // If self-hosted, only add fallback tools
  if (!IS_PLATFORM) {
    tools = {
      ...tools,
      ...getFallbackTools({
        projectRef,
        connectionString,
        authorization,
        includeSchemaMetadata: aiOptInLevel !== 'disabled',
      }),
    }
  } else if (accessToken) {
    // If platform, fetch MCP and other platform specific tools
    const mcpTools = await getMcpTools({
      accessToken,
      projectRef,
      aiOptInLevel,
    })

    tools = {
      ...tools,
      ...mcpTools,
      ...getSchemaTools({
        projectRef,
        connectionString,
        authorization,
      }),
      ...(baseUrl ? getIncidentTools({ baseUrl }) : {}),
    }
  }

  // Filter all tools based on the (potentially modified) AI opt-in level
  const toolsWithSupport = supportMode ? { ...tools, ...getSupportLifecycleTools() } : tools
  const filteredTools: ToolSet = filterToolsByOptInLevel(toolsWithSupport, aiOptInLevel)

  return filteredTools
}
