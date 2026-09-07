import type { AgentToolPolicy } from '@supabase/agent-runtime'

import {
  ASSISTANT_MCP_TOOLS,
  ASSISTANT_NO_DATA_PERMISSIONS,
  assistantSqlModelOutput,
  canShareAssistantData,
  type ProjectPermissionLevel,
} from '../../permissions'

function dataPolicy(minimum: ProjectPermissionLevel): AgentToolPolicy<ProjectPermissionLevel> {
  return {
    canExecute: (level) => canShareAssistantData(level, minimum),
    deniedOutput: {
      message: 'This tool requires additional Assistant project data sharing permission.',
    },
    modelOutput: (output, level) =>
      canShareAssistantData(level, minimum) ? output : ASSISTANT_NO_DATA_PERMISSIONS,
  }
}

/** Remote discovery cannot grant capabilities or replace the approval-gated project tools. */
export const assistantMcpToolPolicies = Object.fromEntries(
  Object.entries(ASSISTANT_MCP_TOOLS).map(([name, minimum]) => [name, dataPolicy(minimum)])
)

/** Shared projections for the current turn and stored history after consent changes. */
export const assistantToolPolicies: Record<string, AgentToolPolicy<ProjectPermissionLevel>> = {
  ...assistantMcpToolPolicies,
  list_policies: dataPolicy('schema'),
  execute_sql: {
    needsApproval: true,
    modelOutput: assistantSqlModelOutput,
    modelError: (error, level) => {
      if (level !== 'schema_and_log_and_data')
        return 'The query failed. Database error details are withheld by project data sharing permissions.'
      return error instanceof Error ? error.message : String(error)
    },
  },
  deploy_edge_function: { needsApproval: true },
  rename_chat: {},
  load_knowledge: {},
  get_active_incidents: {},
  escalate_to_human: {},
  resolve_support_conversation: {},
}
