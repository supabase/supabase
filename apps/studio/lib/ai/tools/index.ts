import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { filterToolsByOptInLevel } from '../tool-filter'
import { getFallbackTools } from './fallback-tools'
import { ToolSet } from 'ai'
import { IS_PLATFORM } from 'common'
import { getIncidentTools } from './incident-tools'
import { getMcpTools } from './mcp-tools'
import { getSchemaTools } from './schema-tools'
import { getRenderingTools } from './rendering-tools'

export const getTools = async ({
  projectRef,
  connectionString,
  authorization,
  aiOptInLevel,
  accessToken,
  baseUrl,
}: {
  projectRef: string
  connectionString: string
  authorization?: string
  aiOptInLevel: AiOptInLevel
  accessToken?: string
  baseUrl?: string
}) => {
  // Always include rendering tools
  let tools: ToolSet = getRenderingTools()

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
  const filteredTools: ToolSet = filterToolsByOptInLevel(tools, aiOptInLevel)

  return filteredTools
}
