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
  signal,
}: {
  projectRef: string
  connectionString: string
  authorization?: string
  aiOptInLevel: AiOptInLevel
  accessToken?: string
  baseUrl?: string
  supportMode?: boolean
  // Required: tools fetched from the remote MCP server hold an HTTP connection
  // that is closed when this signal aborts (i.e. when the request ends).
  signal: AbortSignal
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
    // If platform, fetch MCP and other platform specific tools. The MCP tools
    // may be fetched from the remote MCP server over the network (see
    // `USE_REMOTE_MCP`), so a failure there (outage, timeout, auth) should
    // degrade gracefully to the remaining tools rather than break the entire
    // assistant.
    let mcpTools: ToolSet = {}
    try {
      mcpTools = await getMcpTools({
        accessToken,
        projectRef,
        aiOptInLevel,
        signal,
      })
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error)
    }

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
