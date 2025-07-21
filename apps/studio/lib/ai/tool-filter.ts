import { Tool, ToolSet, ToolExecutionOptions } from 'ai'
import { z } from 'zod'
import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'

// Add the DatabaseExtension type import
export type DatabaseExtension = {
  comment: string | null
  default_version: string
  installed_version: string | null
  name: string
  schema: string | null
}

const basicToolSchema = z.custom<Tool>((value) => typeof value === 'object')

/**
 * Schema for validating that a tool set only contains known tools.
 */
export const toolSetValidationSchema = z.record(
  z.enum([
    // MCP tools
    'list_tables',
    'list_extensions',
    'list_edge_functions',
    'list_branches',
    'search_docs',
    'get_advisors',

    // Local tools
    'display_query',
    'display_edge_function',
    'rename_chat',
    'getSchemaTables',
    'getRlsKnowledge',
    'getFunctions',
    'getEdgeFunctionKnowledge',
  ]),
  basicToolSchema
)

/**
 * Transforms the result of a tool execution to a new output.
 */
export function transformToolResult<OriginalResult, NewResult>(
  tool: Tool<any, OriginalResult>,
  execute: (result: OriginalResult) => NewResult
): Tool<any, NewResult> {
  if (!tool) {
    throw new Error('Tool is required')
  }

  if (!tool.execute) {
    throw new Error('Tool does not have an execute function')
  }

  // Intercept the tool to add a custom execute function
  return {
    ...tool,
    execute: async (args: any, options: ToolExecutionOptions) => {
      const result = await tool.execute!(args, options)
      return execute(result)
    },
  } as Tool<any, NewResult>
}

/**
 * Tool categories based on the data they access
 */
export const TOOL_CATEGORIES = {
  // UI tools that are always available regardless of opt-in level
  UI: 'ui',
  // Schema-level tools that require schema opt-in
  SCHEMA: 'schema',
  // Log-level tools that require schema_and_log opt-in
  LOG: 'log',
  // Data-level tools that require schema_and_log_and_data opt-in
  DATA: 'data',
} as const

type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES]

/**
 * Mapping of tool names to their categories
 */
export const TOOL_CATEGORY_MAP: Record<string, ToolCategory> = {
  // UI tools - always available
  display_query: TOOL_CATEGORIES.UI,
  display_edge_function: TOOL_CATEGORIES.UI,
  rename_chat: TOOL_CATEGORIES.UI,
  search_docs: TOOL_CATEGORIES.UI,

  // Schema tools - MCP
  list_tables: TOOL_CATEGORIES.SCHEMA,
  list_extensions: TOOL_CATEGORIES.SCHEMA,
  list_edge_functions: TOOL_CATEGORIES.SCHEMA,
  list_branches: TOOL_CATEGORIES.SCHEMA,

  // Log tools - MCP and local
  get_advisors: TOOL_CATEGORIES.LOG,
}

/**
 * Get the minimum opt-in level required for a tool category
 */
function getMinimumOptInLevel(category: ToolCategory): AiOptInLevel | null {
  switch (category) {
    case TOOL_CATEGORIES.UI:
      return null // Always available
    case TOOL_CATEGORIES.SCHEMA:
      return 'schema'
    case TOOL_CATEGORIES.LOG:
      return 'schema_and_log'
    case TOOL_CATEGORIES.DATA:
      return 'schema_and_log_and_data'
    default:
      return null
  }
}

/**
 * Check if a tool is allowed based on the current opt-in level
 */
function isToolAllowed(toolName: string, aiOptInLevel: AiOptInLevel): boolean {
  const category = TOOL_CATEGORY_MAP[toolName]

  if (!category) {
    return false
  }

  const minimumLevel = getMinimumOptInLevel(category)

  // UI tools are always allowed
  if (!minimumLevel) {
    return true
  }

  // Check if current opt-in level meets the minimum requirement
  const optInHierarchy: AiOptInLevel[] = [
    'disabled',
    'schema',
    'schema_and_log',
    'schema_and_log_and_data',
  ]

  const currentLevelIndex = optInHierarchy.indexOf(aiOptInLevel)
  const minimumLevelIndex = optInHierarchy.indexOf(minimumLevel)

  return currentLevelIndex >= minimumLevelIndex
}

/**
 * Create a privacy message tool that explains why the tool is not available
 */
export function createPrivacyMessageTool(toolInstance: Tool<any, any>) {
  const privacyMessage =
    "You don't have permission to use this tool. This is an organization-wide setting requiring you to opt-in. Please choose your preferred data sharing level in your organization's settings. Supabase Assistant uses Amazon Bedrock, which does not store or log your prompts and completions, use them to train AWS models, or distribute them to third parties. By default, no data is shared. Granting permission allows Supabase to send information (like schema, logs, or data, depending on your chosen level) to Bedrock solely to generate responses."
  const condensedPrivacyMessage =
    'Requires opting in to sending data to Bedrock which does not store, train on, or distribute it. You can opt in via organization settings.'

  return {
    ...toolInstance,
    description: `${toolInstance.description} (Note: ${condensedPrivacyMessage})`,
    execute: async (_args: any, _context: any) => ({ status: privacyMessage }),
  }
}

/**
 * Filter tools based on the AI opt-in level
 */
export function filterToolsByOptInLevel(tools: ToolSet, aiOptInLevel: AiOptInLevel): ToolSet {
  return Object.fromEntries(
    Object.entries(tools)
      .filter(([toolName]) => TOOL_CATEGORY_MAP[toolName] !== undefined)
      .map(([toolName, toolInstance]) => {
        if (isToolAllowed(toolName, aiOptInLevel)) {
          return [toolName, toolInstance]
        }

        // If the tool is not allowed, provide a stub that returns a privacy message
        return [toolName, createPrivacyMessageTool(toolInstance)]
      })
  )
}
