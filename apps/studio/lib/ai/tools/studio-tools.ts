import { createTool as createDeployEdgeFunctionTool } from './deploy-edge-function.server'
import { createTool as createExecuteSqlTool } from './execute-sql.server'
import { createTool as createLoadKnowledgeTool } from './load-knowledge.server'
import { createTool as createRenameChatTool } from './rename-chat.server'
import type { ToolContext } from './types'
import { createTool as createUpdateOptInLevelTool } from './update-opt-in-level.server'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export const getStudioTools = (ctx: ToolContext) => ({
  execute_sql: createExecuteSqlTool(ctx),
  deploy_edge_function: createDeployEdgeFunctionTool(ctx),
  rename_chat: createRenameChatTool(ctx),
  load_knowledge: createLoadKnowledgeTool(ctx),
})

/** Registered at every level so an approval that lands on the top level can still execute. */
export const getOptInTools = ({ aiOptInLevel }: { aiOptInLevel: AiOptInLevel }) => ({
  update_opt_in_level: createUpdateOptInLevelTool({ aiOptInLevel }),
})
