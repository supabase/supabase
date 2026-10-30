import type { ToolSet } from 'ai'

import { createTool as createCreateNotebook } from './create-notebook.server'
import { createTool as createDeleteNotebook } from './delete-notebook.server'
import { createTool as createDeployEdgeFunction } from './deploy-edge-function.server'
import { createTool as createEscalateToHuman } from './escalate-to-human.server'
import { createTool as createExecuteSql } from './execute-sql.server'
import { createTool as createGetActiveIncidents } from './get-active-incidents.server'
import { createTool as createGetNotebook } from './get-notebook.server'
import { createTool as createGetReport } from './get-report.server'
import { createTool as createListDatabases } from './list-databases.server'
import { createTool as createListNotebooks } from './list-notebooks.server'
import { createTool as createListPolicies } from './list-policies.server'
import { createTool as createListReports } from './list-reports.server'
import { createTool as createLoadKnowledge } from './load-knowledge.server'
import {
  isToolAvailable,
  TOOL_CONTRACTS,
  type ContractToolName,
  type ToolRequest,
} from './registry'
import { createTool as createRenameChat } from './rename-chat.server'
import { createTool as createResolveSupportConversation } from './resolve-support-conversation.server'
import { createTool as createRunNotebook } from './run-notebook.server'
import type { ToolContext, ToolFactory } from './types'
import { createTool as createUpdateNotebook } from './update-notebook.server'
import { createTool as createUpdateOptInLevel } from './update-opt-in-level.server'

/**
 * The server half of every contract. The mapped type makes a missing or mismatched factory a
 * type error, so a contract can't be added without a way to build it.
 */
export const TOOL_FACTORIES = {
  create_notebook: createCreateNotebook,
  delete_notebook: createDeleteNotebook,
  deploy_edge_function: createDeployEdgeFunction,
  escalate_to_human: createEscalateToHuman,
  execute_sql: createExecuteSql,
  get_active_incidents: createGetActiveIncidents,
  get_notebook: createGetNotebook,
  get_report: createGetReport,
  list_databases: createListDatabases,
  list_notebooks: createListNotebooks,
  list_policies: createListPolicies,
  list_reports: createListReports,
  load_knowledge: createLoadKnowledge,
  rename_chat: createRenameChat,
  resolve_support_conversation: createResolveSupportConversation,
  run_notebook: createRunNotebook,
  update_notebook: createUpdateNotebook,
  update_opt_in_level: createUpdateOptInLevel,
} as const satisfies { [K in ContractToolName]: ToolFactory<(typeof TOOL_CONTRACTS)[K]> }

/** Builds the contract tools that exist in the request's environment and whose requirements it meets. */
export function buildLocalTools(ctx: ToolContext, request: ToolRequest): ToolSet {
  const tools: ToolSet = {}
  for (const name of Object.keys(TOOL_FACTORIES) as ContractToolName[]) {
    if (!isToolAvailable(TOOL_CONTRACTS[name].availability, request)) continue
    tools[name] = TOOL_FACTORIES[name](ctx)
  }
  return tools
}
