import { isToolUIPart, type DynamicToolUIPart, type ToolUIPart, type UIMessage } from 'ai'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { decodeNotebookToolError } from '@/lib/ai/tools/notebook-tools'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'

const INVALID_TOOL_STATES = [
  'input-streaming',
  'input-available',
  'approval-requested',
  'output-error',
]

/**
 * Notebook tool errors are opted into model visibility explicitly (NotebookToolError,
 * encoded in generate-v4.ts's onError). A successful parse against the schema — including
 * its literal `tag` — is proof enough that this was a NotebookToolError; every other
 * output-error stays hidden, same as before. Rewrites errorText back to the plain message
 * so the model sees prose, not JSON.
 */
function exposedNotebookErrorPart(
  part: ToolUIPart | DynamicToolUIPart
): ToolUIPart | DynamicToolUIPart | null {
  if (part.state !== 'output-error') return null
  const decoded = decodeNotebookToolError(part.errorText)
  if (!decoded?.exposeToAssistant) return null
  return { ...part, errorText: decoded.message }
}

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
        const exposed = exposedNotebookErrorPart(part)
        return exposed ? [sanitizeMessagePart(exposed, aiOptInLevel)] : []
      })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })
}
