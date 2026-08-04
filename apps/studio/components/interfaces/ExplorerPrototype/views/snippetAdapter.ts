/**
 * PROTOTYPE — the snippet adapter from the design diagram (PR E6).
 *
 * A snippet is a one-cell notebook. These two pure functions are the whole
 * mapping, and they are what makes the Explorer snippet view able to render the
 * same shared QueryCell component as notebook cells.
 *
 * Note what the adapter does with source: today a snippet's source is *derived*
 * from its content type and is immutable. Mapping into a QueryCell makes source
 * an explicit, editable field — so mapping back has to write the content type
 * from the chosen source.
 */

import type { QueryCellModel, SnippetDoc } from '../ExplorerPrototype.types'

const DEFAULT_LOG_RANGE = { type: 'relative' as const, amount: 1, unit: 'hour' as const }

export const snippetToQueryCell = (snippet: SnippetDoc): QueryCellModel => ({
  id: snippet.id,
  type: 'query',
  name: snippet.name,
  query: {
    type: 'inline',
    source:
      snippet.contentType === 'log_sql'
        ? { id: 'logs', parameters: { time_range: DEFAULT_LOG_RANGE } }
        : { id: 'database', parameters: { identifier: 'primary' } },
    sql: snippet.sql,
  },
  display: snippet.display,
})

export const queryCellToSnippet = (cell: QueryCellModel, base: SnippetDoc): SnippetDoc => ({
  ...base,
  name: cell.name,
  contentType: cell.query.source.id === 'logs' ? 'log_sql' : 'sql',
  sql: cell.query.sql,
  display: cell.display,
})
