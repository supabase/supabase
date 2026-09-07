import { composeTools } from '@supabase/agent-runtime'

import type { ProjectPermissionLevel } from '../../permissions'
import { getIncidentTools } from './incident-tools'
import { getMcpTools } from './mcp-tools'
import { getProjectToolDefinitions, type ManagementApi } from './project-tools'
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
  executeOperation,
}: {
  projectRef: string
  oauthToken: string
  managementApi: ManagementApi
  supportMode?: boolean
  signal: AbortSignal
  aiOptInLevel: ProjectPermissionLevel
  executeOperation: Parameters<typeof getProjectToolDefinitions>[0]['executeOperation']
}) {
  const mcp = await getMcpTools({ oauthToken, projectRef, signal })
  try {
    const tools = composeTools({
      base: mcp.tools,
      overrides: getProjectToolDefinitions({
        managementApi,
        executeOperation,
      }),
      extensions: [
        ...(aiOptInLevel !== 'disabled' ? [getSchemaTools({ managementApi })] : []),
        getIncidentTools(),
        ...(supportMode ? [getSupportLifecycleTools()] : []),
      ],
    })
    return { tools, close: mcp.close }
  } catch (error) {
    await mcp.close()
    throw error
  }
}
