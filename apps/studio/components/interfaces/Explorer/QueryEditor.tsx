import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { useFlag } from 'common'
import { CodeSquare, Eye, EyeOff, Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from 'ui'

import { resolveLogTimeRange } from '../QuerySources/LogTimeRange.utils'
import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
  ExplorerQueryViewport,
} from './ExplorerQuery'
import { ExplorerQuerySourceMenu } from './ExplorerQuerySourceMenu'
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
import { isValidConnString } from '@/data/fetchers'
import { useExecuteLogsSqlMutation } from '@/data/logs/execute-logs-sql-mutation'
import { acceptUntrustedLogsSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import {
  createDefaultCellSource,
  QUERY_SOURCE_REGISTRY,
  type CellSource,
} from '@/data/query-sources/query-source-registry'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type QueryEditorProps = {
  id: string
  variant: 'embedded' | 'viewport'
  title: string
  sql: string
  source?: CellSource
  result?: QueryResult
  rowLimit?: number
  display?: QueryDisplay
  toolbarActions?: ReactNode
  onTitleChange: (title: string) => void
  onSqlChange: (sql: string) => void
  onSqlCommit?: (sql: string) => void
  onSourceChange?: (source: CellSource) => void
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
  source,
  result,
  rowLimit,
  display,
  toolbarActions,
  onTitleChange,
  onSqlChange,
  onSqlCommit,
  onSourceChange,
  onResultChange,
  onDisplayChange,
}: QueryEditorProps) => {
  const sqlRef = useLatest(sql)
  const onSqlCommitRef = useLatest(onSqlCommit)

  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const view = display?.view ?? 'table'
  const columns = Object.keys(result?.rows?.[0] ?? {})
  const sourceBinding = source ?? createDefaultCellSource('database')

  const [showQuery, setShowQuery] = useState(true)

  const databaseIdentifier =
    sourceBinding.type === 'database' ? sourceBinding.parameters.identifier : undefined

  const { data: databases, isPending: isLoadingDatabases } = useReadReplicasQuery(
    { projectRef: project?.ref },
    {
      enabled:
        databaseIdentifier !== undefined &&
        project?.ref !== undefined &&
        databaseIdentifier !== project.ref,
    }
  )

  const { mutate: executeSql, isPending: isExecutingSql } = useExecuteSqlMutation({
    onSuccess: (data) => onResultChange({ rows: data.result }),
    onError: (error) => onResultChange({ error }),
  })

  const { mutate: executeLogsSql, isPending: isExecutingLogs } = useExecuteLogsSqlMutation({
    onSuccess: (data) => onResultChange({ rows: data.rows as readonly Record<string, unknown>[] }),
    onError: (error) => onResultChange({ error }),
  })

  const isResolvingDatabase =
    databaseIdentifier !== undefined && databaseIdentifier !== project?.ref && isLoadingDatabases
  const isExecuting = isExecutingSql || isExecutingLogs
  const isBusy = isLoadingProject || isResolvingDatabase || isExecuting

  const handleRunQuery = (sqlToRun: string = sql) => {
    if (!project || isBusy || sqlToRun.trim().length === 0) return

    onSqlCommit?.(sql)

    if (sourceBinding.type === 'logs') {
      if (!isOtelLogsEnabled) {
        onResultChange({
          error: { message: "Querying logs isn't available for this project yet." },
        })
        return
      }

      executeLogsSql({
        projectRef: project.ref,
        sql: acceptUntrustedLogsSql(untrustedLogSql(sqlToRun)),
        range: resolveLogTimeRange(sourceBinding.parameters.time_range),
        endpoint: QUERY_SOURCE_REGISTRY.logs.endpoint,
      })
      return
    }

    const safeSql = acceptUntrustedSql(untrustedSql(sqlToRun))
    const limitedSql = applyAutoLimit(safeSql, rowLimit)
    const connectionString =
      databaseIdentifier === undefined || databaseIdentifier === project.ref
        ? project.connectionString
        : databases?.find((database) => database.identifier === databaseIdentifier)
            ?.connectionString

    if (!isValidConnString(connectionString)) {
      onResultChange({ error: { message: 'Unable to run query: Connection string is missing' } })
      return
    }

    executeSql({
      projectRef: project.ref,
      connectionString,
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
          {source && onSourceChange && (
            <ExplorerQuerySourceMenu source={source} onSourceChange={onSourceChange} />
          )}
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
        {rowLimit && (
          <>
            <p>·</p>
            <p>Limit {rowLimit} rows</p>
          </>
        )}
      </ExplorerQueryFooter>
    </Shell>
  )
}
