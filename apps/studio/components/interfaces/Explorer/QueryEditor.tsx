import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { CodeSquare, Eye, EyeOff, Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from 'ui'

import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
  ExplorerQueryViewport,
} from './ExplorerQuery'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { DisplaySettingsButton } from './QueryCell/DisplaySettingsButton'
import { QueryResultChart } from './QueryCell/QueryResultChart'
import { QueryResultTable } from './QueryResultTable'
import { type QueryDisplay, type QueryResult } from './types'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type QueryEditorProps = {
  id: string
  variant: 'embedded' | 'viewport'
  title: string
  sql: string
  result?: QueryResult
  rowLimit: number
  display?: QueryDisplay
  toolbarActions?: ReactNode
  onTitleChange: (title: string) => void
  onSqlChange: (sql: string) => void
  onSqlCommit?: (sql: string) => void
  onResultChange: (result: QueryResult) => void
  onDisplayChange?: (display: QueryDisplay) => void
}

/**
 * Shared query editor used by query tabs, notebook cells, and other Explorer surfaces.
 * The consuming surface owns persistence and surrounding chrome; this component owns
 * query-level UI and execution behavior.
 */
export const QueryEditor = ({
  id,
  variant,
  title,
  sql,
  result,
  rowLimit,
  display,
  toolbarActions,
  onTitleChange,
  onSqlChange,
  onSqlCommit,
  onResultChange,
  onDisplayChange,
}: QueryEditorProps) => {
  const sqlRef = useLatest(sql)
  const onSqlCommitRef = useLatest(onSqlCommit)

  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const view = display?.view ?? 'table'
  const columns = Object.keys(result?.rows?.[0] ?? {})

  const [showQuery, setShowQuery] = useState(true)

  const { mutate: executeSql, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess: (data) => onResultChange({ rows: data.result }),
    onError: (error) => onResultChange({ error }),
  })

  const handleRunQuery = (sqlToRun: string = sql) => {
    if (!project || isLoadingProject || isExecuting || sqlToRun.trim().length === 0) return

    onSqlCommit?.(sql)

    const safeSql = acceptUntrustedSql(untrustedSql(sqlToRun))
    const limitedSql = applyAutoLimit(safeSql, rowLimit)

    executeSql({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql: limitedSql.sql,
      autoLimit: limitedSql.appendAutoLimit ? rowLimit : undefined,
      contextualInvalidation: true,
      isStatementTimeoutDisabled: true,
    })
  }

  const Shell = variant === 'viewport' ? ExplorerQueryViewport : ExplorerQuery

  return (
    <Shell className={variant === 'embedded' ? 'mx-auto max-w-4xl' : undefined}>
      <ExplorerToolbar>
        <ExplorerToolbarIcon>
          <CodeSquare size={14} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle onSaveTitle={onTitleChange}>{title}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          {toolbarActions}
          {display && onDisplayChange && (
            <DisplaySettingsButton
              result={result}
              display={display}
              columns={columns}
              disabled={(result?.rows ?? []).length === 0}
              onChange={onDisplayChange}
            />
          )}
          <ExplorerToolbarAction
            icon={showQuery ? <EyeOff /> : <Eye />}
            tooltip={showQuery ? 'Hide query' : 'Show query'}
            onClick={() => setShowQuery((value) => !value)}
          />
          <ExplorerToolbarAction
            loading={isExecuting || isLoadingProject}
            icon={<Play />}
            tooltip="Run query"
            disabled={isLoadingProject || isExecuting || sql.trim().length === 0}
            onClick={() => handleRunQuery()}
          >
            Run
          </ExplorerToolbarAction>
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      {showQuery && (
        <ExplorerQueryEditor
          className={cn('relative', variant === 'viewport' ? 'h-[45%] min-h-48' : undefined)}
        >
          <CodeEditor
            id={`explorer-query-${id}`}
            language="pgsql"
            value={sql}
            placeholder="select * from your_table limit 100;"
            placeholderClassName="top-[13px]"
            className={variant === 'embedded' ? 'h-32' : undefined}
            actions={{ runQuery: { enabled: true, callback: handleRunQuery } }}
            options={{ minimap: { enabled: false }, padding: { top: 8 } }}
            onInputChange={(value) => onSqlChange(value ?? '')}
            onMount={(editor) => {
              editor.onDidBlurEditorWidget(() => onSqlCommitRef.current?.(sqlRef.current))
            }}
          />
        </ExplorerQueryEditor>
      )}

      <ExplorerQueryResults
        className={cn(
          (result?.rows ?? []).length === 0 && view === 'table'
            ? 'items-center justify-center'
            : 'overflow-x-auto'
        )}
      >
        {view === 'table' && <QueryResultTable result={result} />}
        {view === 'chart' && <QueryResultChart chart={display?.chart} result={result} />}
      </ExplorerQueryResults>

      <ExplorerQueryFooter className="flex items-center gap-x-2">
        <p>{(result?.rows ?? []).length.toLocaleString()} rows</p>
        <p>·</p>
        <p>Limit {rowLimit} rows</p>
      </ExplorerQueryFooter>
    </Shell>
  )
}
