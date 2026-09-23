import { type Snapshot } from 'valtio'

import { type QueryResult } from './types'
import { convertResultsToMarkdown } from '@/components/interfaces/SQLEditor/UtilityPanel/Results.utils'
import { formatTimeRange } from '@/components/ui/AIAssistantPanel/AssistantNotebookPreview.utils'
import { type Cell } from '@/data/content/notebooks/notebook-schema'

/**
 * A query cell's last in-session result rendered as a markdown table, or its error if the
 * last run failed — whichever is more useful to paste. Undefined when the cell hasn't been
 * run this session (results aren't persisted with the notebook, see QueryCell's local result
 * state), or when `currentSql` has since diverged from the SQL that produced the result —
 * e.g. the cell was edited but not rerun — since pairing stale results with the current SQL
 * would misrepresent what that query actually returns.
 */
function formatQueryResult(
  result: QueryResult | undefined,
  currentSql: string
): string | undefined {
  if (!result || result.sql !== currentSql) return undefined
  if (result.error) return `**Error:** ${result.error.message}`

  const table = result.rows ? convertResultsToMarkdown([...result.rows]) : undefined
  return table ? `**Results:**\n\n${table}` : undefined
}

/**
 * A backtick fence long enough to enclose `content` without being closed early by a run of
 * backticks inside it (e.g. a SQL comment or string literal quoting markdown).
 */
function getCodeFence(content: string): string {
  const longestBacktickRun = Math.max(0, ...(content.match(/`+/g)?.map((run) => run.length) ?? []))
  return '`'.repeat(Math.max(3, longestBacktickRun + 1))
}

/**
 * Renders a notebook as a markdown document meant to be pasted into an external agent:
 * markdown cells verbatim, query cells as a labelled SQL block. A log cell's `time_range`
 * is called out separately since it's applied as a request parameter rather than baked
 * into the SQL text.
 */
export function notebookToMarkdown({
  name,
  cells,
  getResult,
}: {
  name: string
  cells: readonly Snapshot<Cell>[]
  getResult?: (cellId: string) => QueryResult | undefined
}): string {
  const sections = cells.map((cell) => {
    switch (cell._tag) {
      case 'markdown_cell':
        return cell.text
      case 'database_cell':
      case 'log_cell': {
        const header =
          cell._tag === 'database_cell'
            ? `### ${cell.title ?? 'Untitled query'} (Postgres)`
            : `### ${cell.title ?? 'Untitled query'} (Logs — ClickHouse)\n\n_Time range: ${formatTimeRange(cell.time_range)}_`

        const fence = getCodeFence(cell.unchecked_sql)

        return [
          header,
          `${fence}sql\n${cell.unchecked_sql}\n${fence}`,
          formatQueryResult(getResult?.(cell._id), cell.unchecked_sql),
        ]
          .filter((part): part is string => part !== undefined)
          .join('\n\n')
      }
    }
  })

  return [`# ${name}`, ...sections].join('\n\n')
}
