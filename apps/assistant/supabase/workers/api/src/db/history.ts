import { isDeepStrictEqual } from 'node:util'
import { isToolUIPart, type UIMessage } from 'ai'

import { HttpError } from '../http/errors'

function conflict(): never {
  throw new HttpError(409, 'conflict', 'The conversation changed. Reload it before continuing.')
}

function validateAssistant(previous: UIMessage, next: UIMessage) {
  if (previous.parts.length !== next.parts.length) conflict()
  previous.parts.forEach((part, index) => {
    const update = next.parts[index]
    if (isDeepStrictEqual(part, update)) return
    if (
      !isToolUIPart(part) ||
      !isToolUIPart(update) ||
      part.state !== 'approval-requested' ||
      update.state !== 'approval-responded'
    )
      conflict()
    const { state: _state, approval: _approval, ...before } = part
    const { state: _nextState, approval: _nextApproval, ...after } = update
    if (
      !isDeepStrictEqual(before, after) ||
      part.approval.id !== update.approval.id ||
      typeof update.approval.approved !== 'boolean'
    )
      conflict()
  })
}

/** The client sends a sliding window. Only a user turn or a stored pending approval can change. */
export function reconcileMessages(
  previous: UIMessage[],
  incoming: UIMessage[],
  trigger = 'submit-message'
): UIMessage[] {
  if (!incoming.length || new Set(incoming.map((m) => m.id)).size !== incoming.length) conflict()
  const first = previous.findIndex((message) => message.id === incoming[0].id)
  const prefix = first < 0 ? previous : previous.slice(0, first)
  const latest = incoming.at(-1)!
  for (const [index, message] of incoming.entries()) {
    const stored = previous.find((old) => old.id === message.id)
    if (message.role === 'system') conflict()
    if (message.role === 'assistant') {
      if (!stored || stored.role !== 'assistant') conflict()
      if (index === incoming.length - 1) validateAssistant(stored, message)
      else if (!isDeepStrictEqual(stored.parts, message.parts)) conflict()
    } else if (stored && stored.role !== 'user') conflict()
    else if (message.parts.some((part) => !['text', 'file'].includes(part.type))) conflict()
    else if (index !== incoming.length - 1 && (!stored || !isDeepStrictEqual(stored, message)))
      conflict()
    if (stored && first >= 0 && previous[first + index]?.id !== message.id) conflict()
  }
  if (latest.role === 'assistant') {
    if (previous.at(-1)?.id !== latest.id || trigger === 'regenerate-message') conflict()
    const approved = latest.parts.some(
      (part) => isToolUIPart(part) && part.state === 'approval-responded'
    )
    if (!approved) conflict()
  }
  if (first < 0 && (incoming.length !== 1 || latest.role !== 'user')) conflict()
  return [...prefix, ...incoming]
}
