import { isToolUIPart, type UIMessage } from 'ai'

import type { AiOptInLevel } from './opt-in'
import { sanitizeMessagePart } from './tools/tool-sanitizer'

const INVALID_TOOL_STATES = [
  'input-streaming',
  'input-available',
  'approval-requested',
  'output-error',
]

/** Trims history to the last 7 messages and strips tool parts the model shouldn't see. */
export function prepareMessagesForModel(rawMessages: UIMessage[], aiOptInLevel: AiOptInLevel) {
  return (rawMessages || []).slice(-7).map((msg) => {
    if (msg && msg.role === 'assistant' && 'results' in msg) {
      const cleanedMsg = { ...msg }
      delete cleanedMsg.results
      return cleanedMsg
    }
    if (msg && msg.role === 'assistant' && msg.parts) {
      const cleanedParts = msg.parts.flatMap((part) => {
        if (!isToolUIPart(part)) return [part]
        if (!INVALID_TOOL_STATES.includes(part.state))
          return [sanitizeMessagePart(part, aiOptInLevel)]
        return []
      })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })
}
