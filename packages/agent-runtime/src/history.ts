import { isDeepStrictEqual } from 'node:util'
import { isToolUIPart, type UIMessage } from 'ai'

import {
  authorizeAgentApprovalResponse,
  type AgentApprovalResponse,
  type CanRespondToAgentApproval,
} from './approvals'

export class AgentHistoryConflictError extends Error {
  readonly code = 'history_conflict'

  constructor() {
    super('The conversation changed. Reload it before continuing.')
    this.name = 'AgentHistoryConflictError'
  }
}

export type ReconcileAgentMessagesOptions<TContext = undefined> = { trigger?: string } & (
  | { context: TContext; canRespondToApproval?: CanRespondToAgentApproval<TContext> }
  | { context?: TContext; canRespondToApproval?: undefined }
)

function conflict(): never {
  throw new AgentHistoryConflictError()
}

function validateAssistant(previous: UIMessage, next: UIMessage): AgentApprovalResponse[] {
  const { parts: previousParts, ...previousEnvelope } = previous
  const { parts: nextParts, ...nextEnvelope } = next
  if (!isDeepStrictEqual(previousEnvelope, nextEnvelope)) conflict()
  if (previousParts.length !== nextParts.length) conflict()
  const decisions: AgentApprovalResponse[] = []
  previousParts.forEach((part, index) => {
    const update = nextParts[index]
    if (isDeepStrictEqual(part, update)) return
    if (
      !isToolUIPart(part) ||
      !isToolUIPart(update) ||
      part.state !== 'approval-requested' ||
      update.state !== 'approval-responded'
    )
      conflict()
    const { state: _state, approval: storedApproval, ...before } = part
    const { state: _nextState, approval: incomingApproval, ...after } = update
    const { approved, reason, ...immutableApproval } = incomingApproval
    if (
      !isDeepStrictEqual(before, after) ||
      !isDeepStrictEqual(storedApproval, immutableApproval) ||
      typeof approved !== 'boolean' ||
      (reason !== undefined && typeof reason !== 'string')
    )
      conflict()
    decisions.push({
      messageId: previous.id,
      approvalId: storedApproval.id,
      toolName: part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5),
      toolCallId: part.toolCallId,
      input: part.input,
      approved,
      ...(reason !== undefined ? { reason } : {}),
    })
  })
  return decisions
}

/**
 * Reconcile a client sliding window against canonical history. Callers retain ownership
 * checks, database transactions and durable claims before executing approved operations.
 */
export async function reconcileAgentMessages<TContext = undefined>(
  previous: UIMessage[],
  incoming: UIMessage[],
  options: ReconcileAgentMessagesOptions<TContext> = {}
): Promise<UIMessage[]> {
  const trigger = options.trigger ?? 'submit-message'
  if (
    !incoming.length ||
    new Set(incoming.map((message) => message.id)).size !== incoming.length ||
    new Set(previous.map((message) => message.id)).size !== previous.length
  )
    conflict()
  const first = previous.findIndex((message) => message.id === incoming[0].id)
  const prefix = first < 0 ? previous : previous.slice(0, first)
  const latest = incoming.at(-1)!
  const decisions: AgentApprovalResponse[] = []
  for (const [index, message] of incoming.entries()) {
    const stored = previous.find((old) => old.id === message.id)
    if (message.role === 'system') conflict()
    if (message.role === 'assistant') {
      if (!stored || stored.role !== 'assistant') conflict()
      if (index === incoming.length - 1) decisions.push(...validateAssistant(stored, message))
      else if (!isDeepStrictEqual(stored, message)) conflict()
    } else if (stored && stored.role !== 'user') conflict()
    else if (message.parts.some((part) => !['text', 'file'].includes(part.type))) conflict()
    else if (index !== incoming.length - 1 && (!stored || !isDeepStrictEqual(stored, message)))
      conflict()
    if (stored && first >= 0 && previous[first + index]?.id !== message.id) conflict()
  }
  if (latest.role === 'assistant') {
    if (previous.at(-1)?.id !== latest.id || trigger === 'regenerate-message') conflict()
    if (!latest.parts.some((part) => isToolUIPart(part) && part.state === 'approval-responded'))
      conflict()
  }
  if (first < 0 && (incoming.length !== 1 || latest.role !== 'user')) conflict()

  // Validate the entire message window before invoking application authorization callbacks.
  if (options.canRespondToApproval) {
    for (const decision of decisions) {
      await authorizeAgentApprovalResponse(decision, {
        context: options.context,
        canRespondToApproval: options.canRespondToApproval,
      })
    }
  }
  return [...prefix, ...incoming]
}
