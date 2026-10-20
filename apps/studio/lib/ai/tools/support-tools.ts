import { createTool as createEscalateToHumanTool } from './escalate-to-human.server'
import { createTool as createResolveSupportConversationTool } from './resolve-support-conversation.server'
import type { ToolContext } from './types'

export const getSupportLifecycleTools = (ctx: ToolContext = {}) => ({
  escalate_to_human: createEscalateToHumanTool(ctx),
  resolve_support_conversation: createResolveSupportConversationTool(ctx),
})
