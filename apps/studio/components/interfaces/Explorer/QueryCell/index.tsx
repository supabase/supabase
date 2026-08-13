import { untrustedSql } from '@supabase/pg-meta'
import { useState } from 'react'
import { type Snapshot } from 'valtio'

import { QueryEditor } from '../QueryEditor'
import { type QueryDisplay, type QueryResult } from '../types'
import { SortableSection } from '@/components/ui/SortableSection'
import { type DatabaseCell as DatabaseCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface QueryCellProps {
  cell: Snapshot<DatabaseCellSchema>
}

type QueryCellUpdate = { sql: string } | { title: string } | { display: QueryDisplay }

/** Notebook adapter around the shared QueryEditor. */
export const QueryCell = ({ cell }: QueryCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()
  const cells = currentNotebook?.notebook.content?.cells ?? []

  const [sql, setSql] = useState<string>(cell.unchecked_sql)
  const [result, setResult] = useState<QueryResult>()

  const title = cell.title ?? 'Untitled snippet'
  const display: QueryDisplay = {
    view: cell.view ?? 'table',
    chart: cell.chart ? { ...cell.chart, y_columns: [...cell.chart.y_columns] } : undefined,
  }

  const handleUpdateCell = (payload: QueryCellUpdate) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const nextCells = cells.map((candidate) => {
      if (candidate.id !== cell.id || candidate._tag !== 'database_cell') return candidate

      if ('sql' in payload) {
        return { ...candidate, unchecked_sql: untrustedSql(payload.sql) }
      }

      if ('title' in payload) {
        const nextTitle = payload.title.trim()
        return nextTitle ? { ...candidate, title: nextTitle } : candidate
      }

      return {
        ...candidate,
        view: payload.display.view,
        chart: payload.display.chart,
      }
    })

    snap.updateCells({ id: notebookId, cells: nextCells })
  }

  return (
    <SortableSection gripClassName="mt-2.5" id={cell.id}>
      <QueryEditor
        id={cell.id}
        variant="embedded"
        title={title}
        sql={sql}
        result={result}
        rowLimit={cell.row_limit}
        display={display}
        onTitleChange={(title) => handleUpdateCell({ title })}
        onSqlChange={setSql}
        onSqlCommit={(sql) => handleUpdateCell({ sql })}
        onResultChange={setResult}
        onDisplayChange={(display) => handleUpdateCell({ display })}
      />
    </SortableSection>
  )
}
