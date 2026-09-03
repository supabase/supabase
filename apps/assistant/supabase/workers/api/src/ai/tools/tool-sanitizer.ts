import type { ToolUIPart, UIMessage } from 'ai'

import type { AiOptInLevel } from '../opt-in'

interface ToolSanitizer {
  toolName: string
  sanitize: <Tool extends ToolUIPart>(tool: Tool, optInLevel: AiOptInLevel) => Tool
}

export const NO_DATA_PERMISSIONS =
  'The query was executed and the user has viewed the results but decided not to share in the conversation due to permission levels. Continue with your plan unless instructed to interpret the result.'

const executeSqlSanitizer: ToolSanitizer = {
  toolName: 'execute_sql',
  sanitize: (tool) => tool,
}

export const ALL_TOOL_SANITIZERS: Record<string, ToolSanitizer> = {
  [executeSqlSanitizer.toolName]: executeSqlSanitizer,
}

export function sanitizeMessagePart(
  part: UIMessage['parts'][number],
  optInLevel: AiOptInLevel
): UIMessage['parts'][number] {
  if (part.type.startsWith('tool-')) {
    const toolPart = part as ToolUIPart
    const toolName = toolPart.type.slice('tool-'.length)
    const sanitizer = ALL_TOOL_SANITIZERS[toolName]
    if (sanitizer) {
      return sanitizer.sanitize(toolPart, optInLevel)
    }
  }

  return part
}
