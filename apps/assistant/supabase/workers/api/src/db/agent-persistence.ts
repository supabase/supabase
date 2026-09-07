import type { AgentPersistence } from '@supabase/agent-runtime'

import { beginTurn, finishTurn } from './conversations'
import { executeOnce } from './tool-executions'

type AssistantRunContext = {
  userId: string
  conversationId: string
  requestId: string
  revision: number
  supportMetadata?: unknown
}

/** The application maps framework callbacks to its own schema and transactions. */
export const assistantPersistence: AgentPersistence<AssistantRunContext, { revision: number }> = {
  async startRun(context, input) {
    const turn = await beginTurn(
      context.userId,
      context.conversationId,
      context.requestId,
      context.revision,
      input.messages,
      input.trigger,
      context.supportMetadata
    )
    return { state: { revision: turn.revision }, messages: turn.messages }
  },
  finishRun: (context, _state, outcome) =>
    finishTurn(
      context.userId,
      context.conversationId,
      context.requestId,
      outcome.responseMessage,
      outcome.status
    ),
  executeTool: (context, _state, operation) =>
    executeOnce({
      sessionId: context.conversationId,
      userId: context.userId,
      runId: context.requestId,
      toolCallId: operation.toolCallId,
      toolName: operation.name,
      input: operation.input,
      execute: operation.execute,
    }),
}
