import { isToolUIPart, type UIMessage } from 'ai'

import { HttpError } from '../http/errors'
import type { ProjectPermissionLevel as AiOptInLevel } from '../permissions'
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
    // The SDK may download file URLs server-side. Accept inline attachments only.
    if (msg.parts.some((part) => part.type === 'file' && !part.url.startsWith('data:'))) {
      throw new HttpError(
        400,
        'invalid_request',
        'Attach files directly instead of using file URLs.'
      )
    }
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
