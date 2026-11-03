// Expands <ComparisonTable /> tags into GFM for the Markdown export, so the
// export carries the same table the HTML page renders from the same data.
// Import lines are dropped, since the export is plain Markdown.
import { profiles } from '../src/lib/comparisons/index.ts'
import {
  ALL_ROW_KEYS,
  buildComparisonTable,
  type ComparisonTable,
  type RowKey,
} from '../src/lib/comparisons/table.ts'

const TABLE_TAG = /<ComparisonTable\b[^>]*\/>/g
const IMPORT_LINE = /^import .+ from ['"].+['"];?$/gm
const ROWS_PROP = /rows=\{\[([^\]]*)\]\}/

// `rows` is optional. When it's given, each key must be a real row, so a typo
// fails the export instead of silently dropping a row.
export const parseRowsProp = (tag: string): RowKey[] | undefined => {
  const match = ROWS_PROP.exec(tag)
  if (!match) return undefined

  return match[1]
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
    .map((key) => {
      if (!ALL_ROW_KEYS.includes(key as RowKey)) throw new Error(`Unknown comparison row "${key}"`)
      return key as RowKey
    })
}

// A pipe would end the cell early, so escape it.
const escapeCell = (text: string) => text.replace(/\|/g, '\\|')

// Renders a table model as GFM, with footnote references and definitions.
export const renderComparisonTable = (table: ComparisonTable): string => {
  const header = ['', ...table.profileNames].map(escapeCell)
  const lines = [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`]

  for (const row of table.rows) {
    const cells = row.cells.map(
      (cell) => escapeCell(cell.text) + (cell.footnote !== undefined ? `[^${cell.footnote}]` : '')
    )
    lines.push(`| ${[escapeCell(row.label), ...cells].join(' | ')} |`)
  }

  if (table.footnotes.length > 0) {
    lines.push('')
    for (const footnote of table.footnotes) {
      const sources =
        footnote.sourcing_urls.length > 0 ? ` Sources: ${footnote.sourcing_urls.join(', ')}` : ''
      lines.push(`[^${footnote.number}]: ${footnote.notes}${sources}`)
    }
  }

  return lines.join('\n')
}

export const expandComparisonTables = (body: string): string =>
  body
    .replace(IMPORT_LINE, '')
    .replace(TABLE_TAG, (tag) =>
      renderComparisonTable(buildComparisonTable(profiles, parseRowsProp(tag)))
    )
