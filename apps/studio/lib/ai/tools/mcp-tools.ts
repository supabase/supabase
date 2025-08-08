import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { createSupabaseMCPClient } from '../supabase-mcp'
import { filterToolsByOptInLevel, toolSetValidationSchema } from '../tool-filter'

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

  const availableMcpTools = await mcpClient.tools()
  // Filter tools based on the (potentially modified) AI opt-in level
  const allowedMcpTools = filterToolsByOptInLevel(availableMcpTools, aiOptInLevel)

  // Validate that only known tools are provided
  const { data: validatedTools, error: validationError } =
    toolSetValidationSchema.safeParse(allowedMcpTools)

  if (validationError) {
    console.error('MCP tools validation error:', validationError)
    throw new Error('Internal error: MCP tools validation failed')
  }

  return validatedTools
}
