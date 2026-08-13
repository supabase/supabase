import { untrustedSql } from '@supabase/pg-meta'
import { useState } from 'react'
import { type Snapshot } from 'valtio'

import { QueryEditor } from '../QueryEditor'
import { type QueryDisplay, type QueryResult } from '../types'
import { SortableSection } from '@/components/ui/SortableSection'
import {
  type DatabaseCell as DatabaseCellSchema,
  type LogCell as LogCellSchema,
} from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import {
  createDefaultCellSource,
  type CellSource,
} from '@/data/query-sources/query-source-registry'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface QueryCellProps {
  cell: Snapshot<DatabaseCellSchema | LogCellSchema>
}

type QueryCellUpdate = { sql: string } | { title: string } | { display: QueryDisplay }

/** Notebook adapter around the shared QueryEditor. */
export const QueryCell = ({ cell }: QueryCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()
  const cells = currentNotebook?.notebook.content?.cells ?? []

  const { id, title: cellTitle, view, chart, unchecked_sql } = cell
  const rowLimit = 'row_limit' in cell ? cell.row_limit : undefined
  const source =
    cell._tag === 'database_cell'
      ? createDefaultCellSource('database')
      : createDefaultCellSource('logs')

  const [sql, setSql] = useState<string>(unchecked_sql)
  const [result, setResult] = useState<QueryResult>()

  const title = cellTitle ?? 'Untitled snippet'
  const display: QueryDisplay = {
    view: view ?? 'table',
    chart: chart ? { ...chart, y_columns: [...chart.y_columns] } : undefined,
  }

  const handleSourceChange = (source: CellSource) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const nextCells = cells.map((candidate) => {
      if (candidate.id !== id) return candidate

      if (source.type === 'database' && candidate._tag === 'log_cell') {
        const { _tag, time_range, unchecked_sql, ...rest } = candidate
        return {
          ...rest,
          _tag: 'database_cell' as const,
          row_limit: 100,
          unchecked_sql: untrustedSql(unchecked_sql),
        }
      }

      if (source.type === 'logs' && candidate._tag === 'database_cell') {
        const { _tag, row_limit, unchecked_sql, ...rest } = candidate
        return {
          ...rest,
          _tag: 'log_cell' as const,
          time_range: { _tag: 'relative_time_range' as const, unit: 'hour' as const, amount: 1 },
          unchecked_sql: untrustedLogSql(unchecked_sql),
        }
      }

      return candidate
    })

    snap.updateCells({ id: notebookId, cells: nextCells })
  }

  const handleUpdateCell = (payload: QueryCellUpdate) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const nextCells = cells.map((candidate) => {
      if (candidate.id !== id || candidate._tag !== 'database_cell') return candidate

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
    <SortableSection gripClassName="mt-2.5" id={id}>
      <QueryEditor
        id={id}
        variant="embedded"
        title={title}
        sql={sql}
        source={source}
        result={result}
        rowLimit={rowLimit}
        display={cell._tag === 'database_cell' ? display : undefined}
        onTitleChange={(title) => handleUpdateCell({ title })}
        onSqlChange={setSql}
        onSqlCommit={(sql) => handleUpdateCell({ sql })}
        onSourceChange={handleSourceChange}
        onResultChange={setResult}
        onDisplayChange={
          cell._tag === 'database_cell' ? (display) => handleUpdateCell({ display }) : undefined
        }
      />
    </SortableSection>
  )
}
