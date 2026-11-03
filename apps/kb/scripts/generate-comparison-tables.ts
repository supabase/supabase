// Writes the comparison tables into the guides as plain GFM, so the Markdown
// export carries the table too. Each guide holds a marker pair; the generator
// replaces everything between the markers. Run with --check to fail when a guide
// is out of date.
//
//   {/* comparison-table:start <id> */}
//   ...generated table...
//   {/* comparison-table:end <id> */}
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { profiles } from '../src/lib/comparisons'
import {
  ALL_ROW_KEYS,
  buildComparisonTable,
  type ComparisonTable,
  type RowKey,
} from '../src/lib/comparisons/table'

export interface ComparisonTableConfig {
  /** Matches the id in the guide's marker comments. */
  id: string
  /** Guide path, relative to apps/kb. */
  file: string
  rows: RowKey[]
}

export const COMPARISON_TABLES: ComparisonTableConfig[] = [
  {
    id: 'licenses',
    file: 'src/content/guides/licenses.mdx',
    rows: ALL_ROW_KEYS,
  },
  {
    id: 'best-self-hosted',
    file: 'src/content/guides/best-self-hosted-databases.mdx',
    rows: ['self_host', 'license', 'open_source_scope'],
  },
  {
    id: 'best-portable',
    file: 'src/content/guides/best-portable-databases.mdx',
    rows: [
      'wire_protocol',
      'query_model',
      'upstream_projects',
      'export_format',
      'loads_into_standard_server',
    ],
  },
]

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

const markers = (id: string) => ({
  start: `{/* comparison-table:start ${id} */}`,
  end: `{/* comparison-table:end ${id} */}`,
})

// Replaces the body between one id's markers and leaves everything else alone.
export const replaceGeneratedBlock = (source: string, id: string, body: string): string => {
  const { start, end } = markers(id)
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing comparison-table markers for "${id}"`)
  }
  return `${source.slice(0, startIndex + start.length)}\n\n${body}\n\n${source.slice(endIndex)}`
}

const run = (checkOnly: boolean) => {
  let stale = false

  for (const config of COMPARISON_TABLES) {
    const path = resolve(import.meta.dirname, '..', config.file)
    const current = readFileSync(path, 'utf8')
    const table = buildComparisonTable(profiles, config.rows)
    const next = replaceGeneratedBlock(current, config.id, renderComparisonTable(table))

    if (next === current) continue
    if (checkOnly) {
      console.error(`${config.file} is out of date. Run pnpm generate:comparisons.`)
      stale = true
    } else {
      writeFileSync(path, next)
      console.log(`Updated ${config.file}`)
    }
  }

  if (stale) process.exit(1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  run(process.argv.includes('--check'))
}
