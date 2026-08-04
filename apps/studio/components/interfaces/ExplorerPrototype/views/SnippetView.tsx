/**
 * PROTOTYPE — Snippet view.
 *
 * Nothing here knows how to run a query or draw a chart. It maps the snippet
 * through the adapter, hands the resulting one-cell model to the shared
 * QueryCell component, and maps edits back.
 *
 * A snippet is a single query cell, so it always spans the full width — there
 * is no prose to keep at a readable measure.
 */

import type { CellResultState, SnippetDoc } from '../ExplorerPrototype.types'
import { RESOURCE_ICON } from '../ExplorerResources'
import { QueryCell } from '../QueryCell'
import { TabToolbar } from '../TabToolbar'
import { queryCellToSnippet, snippetToQueryCell } from './snippetAdapter'

interface SnippetViewProps {
  snippet: SnippetDoc
  result: CellResultState
  onChange: (snippet: SnippetDoc) => void
  onRun: (rowLimit: number) => void
}

const SNIPPET_ROW_LIMIT = 100

export const SnippetView = ({ snippet, result, onChange, onRun }: SnippetViewProps) => {
  const cell = snippetToQueryCell(snippet)

  return (
    <div className="flex h-full flex-col">
      <TabToolbar icon={RESOURCE_ICON.snippet} title={snippet.name} />

      <div className="flex-1 overflow-y-auto p-4">
        <QueryCell
          value={cell}
          result={result}
          rowLimit={SNIPPET_ROW_LIMIT}
          onChange={(next) => onChange(queryCellToSnippet(next, snippet))}
          onRun={() => onRun(SNIPPET_ROW_LIMIT)}
        />
      </div>
    </div>
  )
}
