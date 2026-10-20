import type { JSONValue } from 'ai'
import { z } from 'zod'

import { lowerOptInLevel, optInLevelSchema } from '../opt-in-level'
import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

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
 */
const stampedOutputSchema = z.object({
  rows: z.array(z.unknown()),
  totalRows: z.number().optional(),
  hasMoreRows: z.boolean().optional(),
  optInLevel: optInLevelSchema,
})

/**
 * Output saved before the stamp existed is a bare array. It's stamped `schema` so its rows
 * stay hidden from the model, and the UI can still show them.
 */
export const executeSqlOutputSchema = z.union([
  stampedOutputSchema,
  z.array(z.unknown()).transform((rows) => ({ rows, optInLevel: 'schema' as const })),
])

export type ExecuteSqlOutput = z.infer<typeof stampedOutputSchema>

export function toModelExecuteSqlOutput(
  output: ExecuteSqlOutput,
  optInLevel: AiOptInLevel
): JSONValue {
  const level = lowerOptInLevel(output.optInLevel, optInLevel)
  return level === 'schema_and_log_and_data'
    ? (toModelRows(output.rows, output) as JSONValue)
    : NO_DATA_PERMISSIONS
}
