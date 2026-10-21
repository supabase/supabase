import type { Tool, ToolSet } from 'ai'
import { z } from 'zod'

import { isOptInLevelAtLeast, optInLevelSchema } from './opt-in-level'
import { getToolContract, type ContractToolName } from './tools/registry'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

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
    'query_logs',
    'get_active_incidents',

    // Local tools
    'execute_sql',
    'deploy_edge_function',
    'rename_chat',
    'update_opt_in_level',
    'escalate_to_human',
    'resolve_support_conversation',
    'list_policies',
    'list_reports',
    'get_report',
    'list_databases',
    'list_notebooks',
    'get_notebook',
    'run_notebook',
    'create_notebook',
    'update_notebook',
    'delete_notebook',

    // Fallback tools for self-hosted
    'getSchemaTables',
    'getRlsKnowledge',
    'getFunctions',
    'getEdgeFunctionKnowledge',

    'load_knowledge',
  ]),
  basicToolSchema
)
export type ToolName = keyof z.infer<typeof toolSetValidationSchema>

export const updateOptInLevelInputSchema = z.object({
  requiredLevel: z
    .enum(['schema', 'schema_and_log', 'schema_and_log_and_data'])
    .optional()
    .describe(
      'The lowest opt-in level that unlocks what you need: `schema` for table and column metadata, `schema_and_log` for logs, `schema_and_log_and_data` for query results. Omit it when the user just wants to review or change the setting, for example to lower it.'
    ),
})

/** Input as stored on the message. `levelWhenAsked` is the org's level when the call was made. */
export const storedUpdateOptInLevelInputSchema = updateOptInLevelInputSchema.extend({
  levelWhenAsked: optInLevelSchema.optional(),
})

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
 * Mapping of tool names to their categories. Tools that have migrated to a contract
 * (`TOOL_CONTRACTS`) declare their own `minOptInLevel` instead and aren't listed here.
 */
export const TOOL_CATEGORY_MAP: Record<Exclude<ToolName, ContractToolName>, ToolCategory> = {
  // UI tools - always available
  update_opt_in_level: TOOL_CATEGORIES.UI,
  search_docs: TOOL_CATEGORIES.UI,

  // Schema tools - MCP
  list_tables: TOOL_CATEGORIES.SCHEMA,
  list_extensions: TOOL_CATEGORIES.SCHEMA,
  list_edge_functions: TOOL_CATEGORIES.SCHEMA,
  list_branches: TOOL_CATEGORIES.SCHEMA,
  getSchemaTables: TOOL_CATEGORIES.SCHEMA,
  getRlsKnowledge: TOOL_CATEGORIES.SCHEMA,
  getFunctions: TOOL_CATEGORIES.SCHEMA,
  getEdgeFunctionKnowledge: TOOL_CATEGORIES.SCHEMA,

  // Log tools - MCP and local
  get_advisors: TOOL_CATEGORIES.LOG,
  query_logs: TOOL_CATEGORIES.LOG,
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

function isCategorizedTool(name: string): name is keyof typeof TOOL_CATEGORY_MAP {
  return Object.hasOwn(TOOL_CATEGORY_MAP, name)
}

/**
 * The lowest opt-in level a tool needs, `null` if it's always available, or `undefined` if the
 * tool isn't on the allowlist. A contract's `minOptInLevel` wins over the category map.
 */
function getToolMinimumLevel(toolName: string): AiOptInLevel | null | undefined {
  const contract = getToolContract(toolName)
  if (contract) return contract.minOptInLevel
  if (isCategorizedTool(toolName)) return getMinimumOptInLevel(TOOL_CATEGORY_MAP[toolName])
  return undefined
}

/**
 * Check if a tool is allowed based on the current opt-in level
 */
function isToolAllowed(toolName: string, aiOptInLevel: AiOptInLevel): boolean {
  const minimumLevel = getToolMinimumLevel(toolName)

  if (minimumLevel === undefined) {
    return false
  }

  // UI tools are always allowed
  if (!minimumLevel) {
    return true
  }

  return isOptInLevelAtLeast(aiOptInLevel, minimumLevel)
}

/**
 * Replaces a blocked tool with a stub that explains the opt-in instead of executing.
 *
 * Names no provider. Studio switches inference providers, and a stale name here becomes a
 * false privacy claim shown to users.
 */
export function createPrivacyMessageTool(toolInstance: Tool<any, any>) {
  const privacyMessage =
    'This tool needs a higher opt-in level than your organization has set. The opt-in level is an organization-wide setting. Call `update_opt_in_level` with the lowest level that unlocks this tool so the user can review it. By default, no data is shared. A higher level allows Supabase to send information (like schema, logs, or data) to third-party AI providers solely to generate responses.'
  const condensedPrivacyMessage =
    'Requires opting in to a higher level of sharing data with third-party AI providers. Call `update_opt_in_level` to ask the user to update it.'
  const toolDescription = toolInstance.description
  const description =
    typeof toolDescription === 'function'
      ? (...args: Parameters<typeof toolDescription>) =>
          `${toolDescription(...args)} (Note: ${condensedPrivacyMessage})`
      : `${toolDescription ?? ''} (Note: ${condensedPrivacyMessage})`

  return {
    ...toolInstance,
    description,
    execute: async (_args: any, _context: any) => ({ status: privacyMessage }),
    // The original transformer expects the original tool's output shape. The privacy
    // stub returns only a status message, so retaining it can crash the response stream.
    toModelOutput: undefined,
  }
}

/**
 * Filter tools based on the AI opt-in level
 */
export function filterToolsByOptInLevel(tools: ToolSet, aiOptInLevel: AiOptInLevel): ToolSet {
  return Object.fromEntries(
    Object.entries(tools)
      .filter(([toolName]) => getToolMinimumLevel(toolName) !== undefined)
      .map(([toolName, toolInstance]) => {
        if (isToolAllowed(toolName, aiOptInLevel)) {
          return [toolName, toolInstance]
        }

        // If the tool is not allowed, provide a stub that returns a privacy message
        return [toolName, createPrivacyMessageTool(toolInstance)]
      })
  )
}
