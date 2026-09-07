import {
  AgentApprovalAuthorizationError,
  AgentHistoryConflictError,
  reconcileAgentMessages,
  type AgentApprovalResponse,
  type ReconcileAgentMessagesOptions,
} from '@supabase/agent-runtime'
import type { UIMessage } from 'ai'

import { HttpError } from '../http/errors'

export type AssistantApprovalContext = { userId: string; ownerId: string }

/** Responder identity and ownership are supplied by the authenticated database transaction. */
export function canRespondToAssistantApproval(
  context: unknown,
  response: AgentApprovalResponse
): boolean {
  return (
    typeof context === 'object' &&
    context !== null &&
    'userId' in context &&
    'ownerId' in context &&
    typeof context.userId === 'string' &&
    context.userId.length > 0 &&
    context.userId === context.ownerId &&
    ['execute_sql', 'deploy_edge_function'].includes(response.toolName)
  )
}

/** Translate framework failures into this application's HTTP contract. */
export async function reconcileMessages<TContext = undefined>(
  previous: UIMessage[],
  incoming: UIMessage[],
  trigger = 'submit-message',
  options: ReconcileAgentMessagesOptions<TContext> = {}
): Promise<UIMessage[]> {
  try {
    if (options.canRespondToApproval) {
      return await reconcileAgentMessages(previous, incoming, { ...options, trigger })
    }
    return await reconcileAgentMessages(previous, incoming, {
      context: options.context,
      canRespondToApproval: canRespondToAssistantApproval,
      trigger,
    })
  } catch (error) {
    if (error instanceof AgentHistoryConflictError) {
      throw new HttpError(409, 'conflict', error.message)
    }
    if (error instanceof AgentApprovalAuthorizationError) {
      throw new HttpError(403, 'unauthorized', error.message)
    }
    throw error
  }
}
