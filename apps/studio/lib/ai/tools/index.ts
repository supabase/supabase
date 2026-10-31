import { ToolSet } from 'ai'
import { IS_PLATFORM } from 'common'

import { filterToolsByOptInLevel } from '../tool-filter'
import { getFallbackTools } from './fallback-tools'
import { getMcpTools } from './mcp-tools'
import { buildLocalTools } from './registry.server'
import type { ToolRequirement } from './types'
import { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export const getTools = async ({
  projectRef,
  connectionString,
  authorization,
  aiOptInLevel,
  accessToken,
  baseUrl,
  supportMode,
  isExplorerEnabled,
  signal,
}: {
  projectRef: string
  connectionString: string
  authorization?: string
  aiOptInLevel: AiOptInLevel
  accessToken?: string
  baseUrl?: string
  supportMode?: boolean
  // Notebooks haven't shipped yet — they live behind the Explorer feature flag, so the
  // assistant must not advertise list_notebooks/get_notebook until the caller confirms the
  // flag is on for this user.
  isExplorerEnabled?: boolean
  // Required: tools fetched from the remote MCP server hold an HTTP connection
  // that is closed when this signal aborts (i.e. when the request ends).
  signal: AbortSignal
}) => {
  const satisfied = new Set<ToolRequirement>()
  if (isExplorerEnabled) satisfied.add('explorer')
  if (supportMode) satisfied.add('supportMode')
  if (baseUrl) satisfied.add('baseUrl')

  const localTools = buildLocalTools(
    { projectRef, connectionString, authorization, aiOptInLevel, baseUrl },
    { environment: IS_PLATFORM ? 'platform' : 'self-hosted', satisfied }
  )

  let tools: ToolSet = {}

  if (!IS_PLATFORM) {
    tools = getFallbackTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      includeSchemaMetadata: aiOptInLevel !== 'disabled',
    })
  } else if (accessToken) {
    try {
      tools = await getMcpTools({
        accessToken,
        projectRef,
        aiOptInLevel,
        signal,
      })
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error)
    }
  }

  return filterToolsByOptInLevel({ ...tools, ...localTools }, aiOptInLevel)
}
