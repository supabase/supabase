import { untrustedSql } from '@supabase/pg-meta'
import { useState } from 'react'
import { type Snapshot } from 'valtio'

import { AddCellDropdown } from '../AddCellDropdown'
import { MoveCellDropdownContent } from '../MoveCellDropdownContent'
import { QueryEditor } from '../QueryEditor'
import { type QueryDisplay, type QueryResult } from '../types'
import { SortableSection } from '@/components/ui/SortableSection'
import {
  type DatabaseCell as DatabaseCellSchema,
  type LogCell as LogCellSchema,
} from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import {
  createDefaultSourceBinding,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface QueryCellProps {
  cell: Snapshot<DatabaseCellSchema | LogCellSchema>
}

/**
 * [Joshen] Aiming to keep PRs small so the following are deliberating missing for now:
 * - Auto limit logic
 * - Database selection logic
 *
 * QueryCell atm minimally supports running queries and rendering results
 */

type QueryCellUpdate = { sql: string } | { title: string } | { display: QueryDisplay }

/** Notebook adapter around the shared QueryEditor. */
export const QueryCell = ({ cell }: QueryCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()

  const { id, title: cellTitle, view, chart, unchecked_sql } = cell
  const rowLimit = 'row_limit' in cell ? cell.row_limit : undefined
  const source =
    cell._tag === 'database_cell'
      ? createDefaultSourceBinding('database')
      : createDefaultSourceBinding('logs')

  const [sql, setSql] = useState<string>(unchecked_sql)
  const [result, setResult] = useState<QueryResult>()

  const title = cellTitle ?? 'Untitled snippet'
  const display: QueryDisplay = {
    view: view ?? 'table',
    chart: chart ? { ...chart, y_columns: [...chart.y_columns] } : undefined,
  }

  const handleSourceChange = (source: QuerySourceBinding) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    snap.updateCell({
      id: notebookId,
      cellId: id,
      updater: (candidate) => {
        if (source._tag === 'database' && candidate._tag === 'log_cell') {
          const { _tag, time_range, unchecked_sql, ...rest } = candidate
          return {
            ...rest,
            _tag: 'database_cell' as const,
            row_limit: 100,
            unchecked_sql: untrustedSql(unchecked_sql),
          }
        }

        if (source._tag === 'logs' && candidate._tag === 'database_cell') {
          const { _tag, row_limit, unchecked_sql, ...rest } = candidate
          return {
            ...rest,
            _tag: 'log_cell' as const,
            time_range: {
              _tag: 'relative_time_range' as const,
              unit: 'hour' as const,
              amount: 1,
            },
            unchecked_sql: untrustedLogSql(unchecked_sql),
          }
        }

        return candidate
      },
    })
  }

  const handleUpdateCell = (payload: QueryCellUpdate) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    snap.updateCell({
      id: notebookId,
      cellId: id,
      updater: (candidate) => {
        if (candidate._tag !== 'database_cell' && candidate._tag !== 'log_cell') return candidate

        if ('sql' in payload) {
          return candidate._tag === 'database_cell'
            ? { ...candidate, unchecked_sql: untrustedSql(payload.sql) }
            : { ...candidate, unchecked_sql: untrustedLogSql(payload.sql) }
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
      },
    })
  }

  return (
    <SortableSection
      id={cell.id}
      actions={<AddCellDropdown cellId={cell.id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell.id} />}
      gripClassName="mt-2 opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
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
