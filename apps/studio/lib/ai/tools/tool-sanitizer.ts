import type { ToolUIPart, UIMessage } from 'ai'

import { sanitizeContractPart } from './registry'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export function sanitizeMessagePart(
  part: UIMessage['parts'][number],
  optInLevel: AiOptInLevel
): UIMessage['parts'][number] {
  if (part.type.startsWith('tool-')) {
    return sanitizeContractPart(part as ToolUIPart, optInLevel) ?? part
  }

  return part
}
