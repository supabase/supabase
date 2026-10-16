import type { ToolUIPart, UIMessage } from 'ai'
import { z } from 'zod'

import { lowerOptInLevel, optInLevelSchema } from '../opt-in-level'
import type { ToolName } from '../tool-filter'
import { sanitizeContractPart } from './registry'
import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

interface ToolSanitizer {
  toolName: ToolName
  sanitize: <Tool extends ToolUIPart>(tool: Tool, optInLevel: AiOptInLevel) => Tool
}

export const NO_DATA_PERMISSIONS =
  'The query was executed and the user has viewed the results but decided not to share in the conversation due to permission levels. Continue with your plan unless instructed to interpret the result. If you need the rows to answer and `update_opt_in_level` is available, call it with `schema_and_log_and_data`, unless the user already skipped that request in this chat.'

// the rows.length default covers chats saved before execute_sql sliced its rows
export const toModelRows = <T>(
  rows: T[],
  {
    totalRows = rows.length,
    hasMoreRows = false,
  }: { totalRows?: number; hasMoreRows?: boolean } = {}
) => {
  if (!hasMoreRows && totalRows <= DEFAULT_CELL_ROW_LIMIT) return rows

  return {
    rows: rows.slice(0, DEFAULT_CELL_ROW_LIMIT),
    note: hasMoreRows
      ? `The query matches more than ${DEFAULT_CELL_ROW_LIMIT} rows. Only the first ${DEFAULT_CELL_ROW_LIMIT} are included because results are capped to protect database performance, so the exact total is unknown. Tell the user it matched more than ${DEFAULT_CELL_ROW_LIMIT} rows and only the first ${DEFAULT_CELL_ROW_LIMIT} are shown. Do not state a specific total.`
      : `Only the first ${DEFAULT_CELL_ROW_LIMIT} of ${totalRows} rows are included.`,
  }
}

/**
 * `optInLevel` is the level the query ran under. Rows are shared only at the lower of that
 * and the current level, so rows from `schema` stay hidden after an upgrade to data.
 * Output saved before the stamp existed is a bare array and stays hidden.
 */
export const executeSqlOutputSchema = z.object({
  rows: z.array(z.unknown()),
  totalRows: z.number().optional(),
  hasMoreRows: z.boolean().optional(),
  optInLevel: optInLevelSchema,
})

const executeSqlSanitizer: ToolSanitizer = {
  toolName: 'execute_sql',
  sanitize: (tool, optInLevel) => {
    const output = tool.output
    const parsed = executeSqlOutputSchema.safeParse(output)

    if (parsed.success) {
      const level = lowerOptInLevel(parsed.data.optInLevel, optInLevel)
      return {
        ...tool,
        output:
          level === 'schema_and_log_and_data'
            ? toModelRows(parsed.data.rows, parsed.data)
            : NO_DATA_PERMISSIONS,
      }
    }

    if (Array.isArray(output)) return { ...tool, output: NO_DATA_PERMISSIONS }

    return { ...tool, output: optInLevel === 'schema_and_log_and_data' ? output : undefined }
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
    const contractPart = sanitizeContractPart(toolPart, optInLevel)
    if (contractPart) return contractPart
    const toolName = toolPart.type.slice('tool-'.length)
    const sanitizer = ALL_TOOL_SANITIZERS[toolName]
    if (sanitizer) {
      return sanitizer.sanitize(toolPart, optInLevel)
    }
  }

  return part
}
