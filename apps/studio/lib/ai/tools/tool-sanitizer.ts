import type { ToolUIPart, UIMessage } from 'ai'
// End of third-party imports

import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import type { ToolName } from '../tool-filter'

interface ToolSanitizer {
  toolName: ToolName
  sanitize: <Tool extends ToolUIPart>(tool: Tool, optInLevel: AiOptInLevel) => Tool
}

const executeSqlSanitizer: ToolSanitizer = {
  toolName: 'execute_sql',
  sanitize: (tool, optInLevel) => {
    const output = tool.output
    let sanitizedOutput: unknown

    if (optInLevel !== 'schema_and_log_and_data') {
      if (Array.isArray(output)) {
        sanitizedOutput =
          'The query was executed but the result is not shared due to permission level'
      }
    } else {
      sanitizedOutput = output
    }

    return {
      ...tool,
      output: sanitizedOutput,
    }
  },
}

export const ALL_TOOL_SANITIZERS = {
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
