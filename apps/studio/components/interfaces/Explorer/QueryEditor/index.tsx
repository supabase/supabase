import { acceptUntrustedSql, untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useFlag } from 'common'
import { CodeSquare, Eye, EyeOff, Play } from 'lucide-react'
import { forwardRef, useImperativeHandle, useState, type ReactNode } from 'react'
import { Button, cn } from 'ui'

import { resolveLogTimeRange } from '../../QuerySources/LogTimeRange.utils'
import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
  ExplorerQueryViewport,
} from '../ExplorerQuery'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '../ExplorerToolbar'
import { type QueryDisplay, type QueryResult } from '../types'
import { DisplaySettingsButton } from './DisplaySettingsButton'
import { QueryResultRenderer } from './QueryResultRenderer'
import { QuerySourceMenu } from './QuerySourceMenu'
import { LegacyLogsRewriteBanner } from '@/components/interfaces/Settings/Logs/LegacyLogsRewriteBanner'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { DiffEditor } from '@/components/ui/DiffEditor'
import {
  type DatabaseSourceParameters,
  type LogsSourceParameters,
} from '@/data/content/notebooks/notebook-schema'
import { isValidConnString } from '@/data/fetchers'
import { useExecuteLogsSqlMutation } from '@/data/logs/execute-logs-sql-mutation'
import {
  acceptUntrustedLogsSql,
  untrustedLogSql,
  type UntrustedLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'
import {
  QUERY_SOURCE_REGISTRY,
  toQuerySourceBinding,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'
import { type LegacyLogsRewriteProposal } from '@/hooks/analytics/useLegacyLogsRewrite'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import {
  isRoleImpersonationEnabled,
  type RoleImpersonationController,
} from '@/state/role-impersonation-state'

/**
 * The query this editor is showing, tagged by backend. The tag correlates the SQL's
 * dialect brand with that backend's parameters, so a single `_tag` check inside
 * `handleRunQuery` narrows both at once and there is no path that sends a query to the
 * wrong wire boundary.
 */
export type ExplorerQueryModel =
  | ({
      _tag: 'database'
      uncheckedSql: UntrustedSqlFragment
      rowLimit?: number
    } & DatabaseSourceParameters)
  | ({
      _tag: 'logs'
      uncheckedSql: UntrustedLogSqlFragment
    } & LogsSourceParameters)

export type QueryEditorProps = {
  id: string
  variant: 'embedded' | 'viewport'
  title: string
  query: ExplorerQueryModel
  result?: QueryResult
  roleImpersonationState?: RoleImpersonationController
  display?: QueryDisplay
  toolbarActions?: ReactNode
  className?: string
  /** Disables the toolbar and editor run actions (e.g. while a confirm footer is shown). */
  isRunDisabled?: boolean
  onTitleChange: (title: string) => void
  onSqlChange: (sql: string) => void
  onSqlCommit?: (sql: string) => void
  onSourceChange?: (source: QuerySourceBinding) => void
  onResultChange: (result: QueryResult) => void
  onRowLimitChange?: (val: number) => void
  onDisplayChange?: (display: QueryDisplay) => void
  onRun?: () => void
}

export type QueryEditorHandle = {
  run: () => Promise<void>
}

/**
 * Shared query editor used by query tabs, notebook cells, and other Explorer surfaces.
 * The consuming surface owns persistence and surrounding chrome; this component owns
 * query-level UI and execution behavior.
 */
export const QueryEditor = forwardRef<QueryEditorHandle, QueryEditorProps>(function QueryEditor(
  {
    id,
    variant,
    title,
    query,
    result,
    roleImpersonationState,
    display,
    toolbarActions,
    className,
    isRunDisabled = false,
    onTitleChange,
    onSqlChange,
    onSqlCommit,
    onSourceChange,
    onResultChange,
    onRowLimitChange,
    onDisplayChange,
    onRun,
  }: QueryEditorProps,
  ref
) {
  const sql = query.uncheckedSql
  const sqlRef = useLatest<string>(sql)
  const onSqlCommitRef = useLatest(onSqlCommit)

  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const view = display?.view ?? 'table'
  const columns = Object.keys(result?.rows?.[0] ?? {})
  const rowLimit = query._tag === 'database' ? query.rowLimit : undefined
  const databaseIdentifier = query._tag === 'database' ? query.database_identifier : undefined

  const [showQuery, setShowQuery] = useState(true)
  const [rewriteProposal, setRewriteProposal] = useState<LegacyLogsRewriteProposal | null>(null)

  const { data: databases, isPending: isLoadingDatabases } = useReadReplicasQuery(
    { projectRef: project?.ref },
    {
      enabled:
        databaseIdentifier !== undefined &&
        project?.ref !== undefined &&
        databaseIdentifier !== project.ref,
    }
  )

  const { mutateAsync: executeSql, isPending: isExecutingSql } = useExecuteSqlMutation({
    onSuccess: (data) => onResultChange({ rows: data.result }),
    onError: (error) => onResultChange({ error }),
  })

  const { mutateAsync: executeLogsSql, isPending: isExecutingLogs } = useExecuteLogsSqlMutation({
    onSuccess: (data) => onResultChange({ rows: data.rows as readonly Record<string, unknown>[] }),
    onError: (error) => onResultChange({ error }),
  })

  const isResolvingDatabase =
    databaseIdentifier !== undefined && databaseIdentifier !== project?.ref && isLoadingDatabases
  const isExecuting = isExecutingSql || isExecutingLogs
  const isBusy = isLoadingProject || isResolvingDatabase || isExecuting

  /**
   * The user's run gesture, and therefore the promotion point for this query's SQL. The
   * raw text comes straight off the editor, so it is (re)branded untrusted here — the
   * editor boundary — and promoted in the same handler. Which pair of helpers applies is
   * decided by `query._tag`, the same discriminant that picks the execution endpoint, so
   * Postgres SQL cannot reach the analytics wire or vice versa.
   */
  const handleRunQuery = async (rawSql: string = sql) => {
    if (!project || isBusy || rewriteProposal || isRunDisabled || rawSql.trim().length === 0) return

    onRun?.()
    onSqlCommit?.(rawSql)

    if (query._tag === 'logs') {
      if (!isOtelLogsEnabled) {
        onResultChange({
          error: { message: "Querying logs isn't available for this project yet." },
        })
        return
      }

      await executeLogsSql({
        projectRef: project.ref,
        sql: acceptUntrustedLogsSql(untrustedLogSql(rawSql)),
        range: resolveLogTimeRange(query.time_range),
        endpoint: QUERY_SOURCE_REGISTRY.logs.endpoint,
      }).catch(() => {})
      return
    }

    const safeSql = acceptUntrustedSql(untrustedSql(rawSql))
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

    await executeSql({
      projectRef: project.ref,
      connectionString,
      sql: wrapWithRoleImpersonation(limitedSql.sql, roleImpersonationState),
      autoLimit: limitedSql.appendAutoLimit ? rowLimit : undefined,
      contextualInvalidation: true,
      isStatementTimeoutDisabled: true,
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    }).catch(() => {})
  }

  const acceptRewrite = () => {
    if (!rewriteProposal) return
    if (sql === rewriteProposal.original) {
      onSqlChange(rewriteProposal.modified)
      onSqlCommit?.(rewriteProposal.modified)
    }
    setRewriteProposal(null)
  }

  const discardRewrite = () => setRewriteProposal(null)

  useImperativeHandle(ref, () => ({ run: () => handleRunQuery() }))

  const Shell = variant === 'viewport' ? ExplorerQueryViewport : ExplorerQuery

  return (
    <Shell className={cn(variant === 'embedded' && 'mx-auto max-w-4xl', className)}>
      <ExplorerToolbar>
        <ExplorerToolbarIcon>
          <CodeSquare size={14} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle onSaveTitle={onTitleChange}>{title}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          {toolbarActions}
          {onSourceChange && (
            <QuerySourceMenu
              disabled={rewriteProposal !== null}
              source={toQuerySourceBinding(query)}
              onSourceChange={(source) => {
                setRewriteProposal(null)
                onSourceChange(source)
              }}
              rowLimit={rowLimit}
              onRowLimitChange={onRowLimitChange}
              roleImpersonationState={roleImpersonationState}
            />
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
            disabled={rewriteProposal !== null}
            tooltip={showQuery ? 'Hide query' : 'Show query'}
            onClick={() => setShowQuery((value) => !value)}
          />
          <ExplorerToolbarAction
            loading={isExecuting || isLoadingProject}
            icon={<Play />}
            tooltip="Run query"
            disabled={
              isLoadingProject ||
              isExecuting ||
              rewriteProposal !== null ||
              isRunDisabled ||
              sql.trim().length === 0
            }
            onClick={() => handleRunQuery()}
          >
            Run
          </ExplorerToolbarAction>
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      {showQuery && (
        <>
          <LegacyLogsRewriteBanner
            isLogsSource={query._tag === 'logs'}
            sql={sql}
            readSql={() => sqlRef.current}
            onProposal={setRewriteProposal}
            hidden={rewriteProposal !== null}
          />
          <ExplorerQueryEditor
            className={cn('relative', variant === 'viewport' ? 'h-[45%] min-h-48' : undefined)}
          >
            <CodeEditor
              id={`explorer-query-${id}`}
              language="pgsql"
              value={sql}
              placeholder="select * from your_table limit 100;"
              placeholderClassName="top-[13px]"
              className={variant === 'embedded' ? 'h-44' : undefined}
              actions={{ runQuery: { enabled: !isRunDisabled, callback: handleRunQuery } }}
              options={{ minimap: { enabled: false }, padding: { top: 8 } }}
              onInputChange={(value) => onSqlChange(value ?? '')}
              onMount={(editor) => {
                editor.onDidBlurEditorWidget(() => onSqlCommitRef.current?.(sqlRef.current))
              }}
            />
            {rewriteProposal && (
              <div className="absolute inset-0 z-10 flex flex-col bg-studio">
                <div className="flex items-center justify-between gap-2 border-b bg-surface-100 px-3 py-2">
                  <span className="text-xs text-foreground-light">
                    Review the ClickHouse SQL rewrite before accepting it
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="default" size="tiny" onClick={discardRewrite}>
                      Discard
                    </Button>
                    <Button variant="primary" size="tiny" onClick={acceptRewrite}>
                      Accept
                    </Button>
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <DiffEditor
                    language="pgsql"
                    original={rewriteProposal.original}
                    modified={rewriteProposal.modified}
                  />
                </div>
              </div>
            )}
          </ExplorerQueryEditor>
        </>
      )}

      <ExplorerQueryResults
        className={cn(
          (result?.rows ?? []).length === 0 ? 'items-center justify-center' : 'overflow-x-auto'
        )}
      >
        <QueryResultRenderer view={view} result={result} chart={display?.chart} />
      </ExplorerQueryResults>

      <ExplorerQueryFooter className="flex items-center gap-x-2">
        <p>{(result?.rows ?? []).length.toLocaleString()} rows</p>
        {rowLimit && (
          <>
            <p>·</p>
            <p>{rowLimit < 0 ? 'No row limit' : `Limit ${rowLimit} rows`}</p>
          </>
        )}
      </ExplorerQueryFooter>
    </Shell>
  )
})
