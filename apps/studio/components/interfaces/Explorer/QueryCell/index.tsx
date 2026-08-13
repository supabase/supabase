import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { CodeSquare, Eye, EyeOff, Play } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'ui'
import { type Snapshot } from 'valtio'

import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
} from '../ExplorerQuery'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '../ExplorerToolbar'
import { QueryResultTable } from '../QueryResultTable'
import { type QueryResult } from '../types'
import { DisplaySettingsButton } from './DisplaySettingsButton'
import { QueryResultChart } from './QueryResultChart'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import { type DatabaseCell as DatabaseCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { type ResponseError } from '@/types'

interface QueryCellProps {
  cell: Snapshot<DatabaseCellSchema>
}

/**
 * [Joshen] Aiming to keep PRs small so the following are deliberating missing for now:
 * - Auto limit logic
 * - Database selection logic
 * - Data display logic
 *
 * QueryCell atm minimally supports running queries and rendering results
 */

export const QueryCell = ({ cell }: QueryCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()
  const { data: project } = useSelectedProjectQuery()
  const cells = currentNotebook?.notebook.content?.cells ?? []

  const { title = 'Untitled snippet', row_limit, view } = cell

  const [showQuery, setShowQuery] = useState(true)
  const [value, setValue] = useState<string>(cell.unchecked_sql)
  const [result, setResult] = useState<QueryResult>()
  const columns = Object.keys(result?.rows?.[0] ?? {})

  const valueRef = useLatest(value)

  const { mutateAsync: executeQuery, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess: (data) =>
      setResult({
        rows: data.result,
        error: undefined,
        autoLimit: undefined,
      }),
    onError: (error) =>
      setResult({
        rows: undefined,
        error: error as unknown as ResponseError,
        autoLimit: undefined,
      }),
  })

  const onRunQuery = async () => {
    if (!project) return console.error('Project is required')

    handleUpdateCell({ sql: value })

    executeQuery({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: acceptUntrustedSql(untrustedSql(value)),
    })
  }

  const handleUpdateCell = (payload: { sql: string } | { title: string }) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const nextCells = cells.map((c) => {
      if (c.id !== cell.id || c._tag !== 'database_cell') {
        return c
      }

      if ('sql' in payload) {
        return { ...c, unchecked_sql: untrustedSql(payload.sql) }
      }

      const trimmedTitle = payload.title.trim()
      return trimmedTitle ? { ...c, title: trimmedTitle } : c
    })

    snap.updateCells({ id: notebookId, cells: nextCells })
  }

  const handleUpdateCellRef = useLatest(handleUpdateCell)

  return (
    <SortableSection gripClassName="mt-2.5" id={cell.id}>
      <ExplorerQuery className="max-w-4xl mx-auto">
        <ExplorerToolbar>
          <ExplorerToolbarIcon>
            <CodeSquare size={14} />
          </ExplorerToolbarIcon>
          <ExplorerToolbarTitle onSaveTitle={(newTitle) => handleUpdateCell({ title: newTitle })}>
            {title}
          </ExplorerToolbarTitle>
          <ExplorerToolbarActions>
            <DisplaySettingsButton
              cell={cell}
              result={result}
              columns={columns}
              disabled={(result?.rows ?? []).length === 0}
            />
            <ExplorerToolbarAction
              icon={showQuery ? <EyeOff /> : <Eye />}
              tooltip={showQuery ? 'Hide query' : 'Show query'}
              onClick={() => setShowQuery((prev) => !prev)}
            />
            <ExplorerToolbarAction
              loading={isExecuting}
              icon={<Play />}
              tooltip="Run query"
              onClick={onRunQuery}
            />
          </ExplorerToolbarActions>
        </ExplorerToolbar>

        {showQuery && (
          <ExplorerQueryEditor>
            <CodeEditor
              language="pgsql"
              value={value}
              onInputChange={(v) => setValue(v ?? '')}
              className="h-32"
              actions={{ runQuery: { enabled: true, callback: onRunQuery } }}
              onMount={(editor) => {
                editor.onDidBlurEditorWidget(() =>
                  handleUpdateCellRef.current({ sql: valueRef.current })
                )
              }}
            />
          </ExplorerQueryEditor>
        )}

        <ExplorerQueryResults
          className={cn(
            (result?.rows ?? []).length === 0 && view === 'table'
              ? 'flex items-center justify-center'
              : 'overflow-x-auto'
          )}
        >
          {view === 'table' && <QueryResultTable result={result} />}
          {view === 'chart' && <QueryResultChart cell={cell} result={result} />}
        </ExplorerQueryResults>

        <ExplorerQueryFooter className="flex items-center gap-x-2">
          <p>{(result?.rows ?? []).length.toLocaleString()} rows</p>
          <p>·</p>
          <p>Limit {row_limit} rows</p>
        </ExplorerQueryFooter>
      </ExplorerQuery>
    </SortableSection>
  )
}
