import { sanitizeToolOutput } from '@supabase/agent-runtime'
import { isToolUIPart, type UIMessage } from 'ai'

import { ASSISTANT_NO_DATA_PERMISSIONS } from '../../permissions'
import type { ProjectPermissionLevel as AiOptInLevel } from '../../permissions'
import { assistantToolPolicies } from './tool-policies'

export function sanitizeMessagePart(
  part: UIMessage['parts'][number],
  optInLevel: AiOptInLevel
): UIMessage['parts'][number] {
  if (isToolUIPart(part) && part.state === 'output-available') {
    const name = part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5)
    return {
      ...part,
      output: sanitizeToolOutput(name, part.output, {
        context: optInLevel,
        policies: assistantToolPolicies,
        input: part.input,
        toolCallId: part.toolCallId,
        unknownOutput: ASSISTANT_NO_DATA_PERMISSIONS,
      }),
    }
  }
  return part
}
