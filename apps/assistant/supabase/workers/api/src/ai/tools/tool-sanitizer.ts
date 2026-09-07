import { isToolUIPart, type UIMessage } from 'ai'

import {
  ASSISTANT_MCP_TOOLS,
  ASSISTANT_NO_DATA_PERMISSIONS,
  assistantSqlModelOutput,
  canShareAssistantData,
} from '../../permissions'
import type { ProjectPermissionLevel as AiOptInLevel } from '../../permissions'

export function sanitizeMessagePart(
  part: UIMessage['parts'][number],
  optInLevel: AiOptInLevel
): UIMessage['parts'][number] {
  if (isToolUIPart(part) && part.type === 'tool-execute_sql' && part.state === 'output-available') {
    return { ...part, output: assistantSqlModelOutput(part.output, optInLevel) }
  }
  if (isToolUIPart(part) && part.state === 'output-available') {
    const name = part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5)
    const minimum =
      name === 'list_policies'
        ? 'schema'
        : Object.entries(ASSISTANT_MCP_TOOLS).find(([tool]) => tool === name)?.[1]
    if (minimum && !canShareAssistantData(optInLevel, minimum))
      return { ...part, output: ASSISTANT_NO_DATA_PERMISSIONS }
  }
  return part
}
