import { tool } from 'ai'

import { createTool as createDeployEdgeFunctionTool } from './deploy-edge-function.server'
import { createTool as createExecuteSqlTool } from './execute-sql.server'
import { createTool as createLoadKnowledgeTool } from './load-knowledge.server'
import { createTool as createRenameChatTool } from './rename-chat.server'
import type { ToolContext } from './types'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { isOptInLevelAtLeast } from '@/lib/ai/opt-in-level'
import { updateOptInLevelInputSchema } from '@/lib/ai/tool-filter'

export const getStudioTools = (ctx: ToolContext = {}) => ({
  execute_sql: createExecuteSqlTool(ctx),
  deploy_edge_function: createDeployEdgeFunctionTool(ctx),
  rename_chat: createRenameChatTool(ctx),
  load_knowledge: createLoadKnowledgeTool(ctx),
})

// Rewritten at parse time so the stored input is what the card shows. A level the org already
// has is a review request, and `levelWhenAsked` outlives the user changing the setting.
export const createUpdateOptInLevelInputSchema = (aiOptInLevel: AiOptInLevel) =>
  updateOptInLevelInputSchema.transform(({ requiredLevel }) => ({
    levelWhenAsked: aiOptInLevel,
    ...(requiredLevel && !isOptInLevelAtLeast(aiOptInLevel, requiredLevel) && { requiredLevel }),
  }))

/** Registered at every level so an approval that lands on the top level can still execute. */
export const getOptInTools = ({ aiOptInLevel }: { aiOptInLevel: AiOptInLevel }) => ({
  update_opt_in_level: tool({
    description:
      'Asks the user to review or change the organization-wide AI opt-in level. Call it with `requiredLevel` when a tool needs a higher level than the organization has or you need to read query results. Call it without `requiredLevel` whenever the user asks to change the setting, including lowering it. Do not call it again in the same chat after the user skipped it unless they ask.',
    inputSchema: createUpdateOptInLevelInputSchema(aiOptInLevel),
    needsApproval: true,
    execute: async ({ requiredLevel }) => {
      const sufficient = !requiredLevel || isOptInLevelAtLeast(aiOptInLevel, requiredLevel)
      return {
        levelAfterReview: aiOptInLevel,
        ...(requiredLevel && { sufficient }),
        ...(!sufficient && {
          status: `The opt-in level is still below the requested ${requiredLevel}. If you still need that access, call update_opt_in_level again.`,
        }),
      }
    },
  }),
})
