import {
  isToolUIPart,
  type UIDataTypes,
  type UIMessage,
  type UIMessagePart,
  type UITools,
} from 'ai'

type UIPart = UIMessagePart<UIDataTypes, UITools>

/**
 * Prepares messages for API transmission by cleaning and limiting history
 */
export function prepareMessagesForAPI(messages: UIMessage[]): UIMessage[] {
  // [Joshen] Specifically limiting the chat history that get's sent to reduce the
  // size of the context that goes into the model. This should always be an odd number
  // as much as possible so that the first message is always the user's
  const MAX_CHAT_HISTORY = 7

  const slicedMessages = messages.slice(-MAX_CHAT_HISTORY)

  // Filter out results from messages before sending to the model
  const cleanedMessages = slicedMessages.map((_message) => {
    const message = _message as UIMessage & { results?: unknown }
    const cleanedMessage = { ...message } as UIMessage & { results?: unknown }
    if (message.role === 'assistant' && message.results) {
      delete cleanedMessage.results
    }
    return cleanedMessage as UIMessage
  })

  return cleanedMessages
}

/**
 * Approval id when the part is waiting on a human Approve/Deny.
 * Narrows with `isToolUIPart` first, matching the AI SDK `useChat` approval pattern:
 * `state === 'approval-requested' && !approval.isAutomatic`.
 *
 * @see https://ai-sdk.dev/docs/agents/tool-approvals
 */
export function getManualApprovalId(part: UIPart): string | undefined {
  if (!isToolUIPart(part) || part.state !== 'approval-requested') return undefined
  if ('isAutomatic' in part.approval && part.approval.isAutomatic === true) return undefined
  return part.approval.id
}

/** True when the part is waiting on a human Approve/Deny, not an automatic policy decision. */
export function isManualApprovalRequested(part: UIPart): boolean {
  return getManualApprovalId(part) !== undefined
}

/**
 * Returns approval IDs to auto-deny when the model issues multiple approval-required
 * tool calls in the same turn — all but the first, so the model reissues them sequentially.
 */
export function getParallelApprovalIdsToReject(messages: UIMessage[]): string[] {
  const lastMessage = messages.findLast((m) => m.role === 'assistant')
  if (!lastMessage) return []

  const pendingIds: string[] = []
  for (const part of lastMessage.parts ?? []) {
    const id = getManualApprovalId(part)
    if (id) pendingIds.push(id)
  }
  return pendingIds.slice(1)
}
