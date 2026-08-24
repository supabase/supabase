import { useMonaco } from '@monaco-editor/react'
import { acceptUntrustedSql, untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useFlag } from 'common'
import { CodeSquare, Eye, EyeOff, Play } from 'lucide-react'
import type { editor as monacoEditor } from 'monaco-editor'
import {
  forwardRef,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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
import { useQueryEditorAi } from './useQueryEditorAi'
import { LegacyLogsRewriteBanner } from '@/components/interfaces/Settings/Logs/LegacyLogsRewriteBanner'
import { RunQueryWarningModal } from '@/components/interfaces/SQLEditor/RunQueryWarningModal'
import type { PotentialIssues } from '@/components/interfaces/SQLEditor/SQLEditor.types'
import {
  analyzeQueryIssues,
  appendEnableRLSStatements,
  hasBlockingIssues,
} from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { useAddDefinitions } from '@/components/interfaces/SQLEditor/useAddDefinitions'
import { ResizableAIWidget } from '@/components/ui/AIEditor/ResizableAIWidget'
import { getEditorSelectionParts, type EditorSelection } from '@/components/ui/AIEditor/utils'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { DiffEditor } from '@/components/ui/DiffEditor'
import {
  type DatabaseSourceParameters,
  type LogsSourceParameters,
} from '@/data/content/notebooks/notebook-schema'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
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
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { detectOS } from '@/lib/helpers'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import {
  isRoleImpersonationEnabled,
  type RoleImpersonationController,
} from '@/state/role-impersonation-state'

const generatePlaceholder = (os: string | undefined) =>
  `Hit ${os === 'macos' ? 'CMD+SHIFT+K' : 'CTRL+SHIFT+K'} to generate query or just start typing`

type PendingProposal = {
  original: string
  modified: string
  label: string
  prompt?: string
}

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

export type QueryEditorHandle = {
  /**
   * `force` skips this query's own blocking-issue check (destructive op, unwhered
   * update/delete, missing RLS, …) — for a caller that already gathered its own consent
   * for this run, e.g. the notebook-wide mutation confirmation.
   */
  run: (force?: boolean) => Promise<void>
  /** The editor's live text buffer, ahead of any blur-triggered commit to the store. */
  getSql: () => string
}

type QueryEditorProps = {
  id: string
  isReadOnly?: boolean
  variant: 'embedded' | 'viewport'
  title: string
  query: ExplorerQueryModel
  result?: QueryResult
  roleImpersonationState?: RoleImpersonationController
  display?: QueryDisplay
  toolbarActions?: ReactNode
  className?: string
  showQuery: boolean
  onShowQueryChange: (showQuery: boolean) => void
  /** When true, toolbar and editor run actions are disabled. */
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

/**
 * Shared query editor used by query tabs, notebook cells, and other Explorer surfaces.
 * The consuming surface owns persistence and surrounding chrome; this component owns
 * query-level UI and execution behavior.
 */
export const QueryEditor = forwardRef<QueryEditorHandle, QueryEditorProps>(function QueryEditor(
  {
    id,
    isReadOnly = false,
    variant,
    title,
    query,
    result,
    roleImpersonationState,
    display,
    toolbarActions,
    className,
    showQuery,
    onShowQueryChange,
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
  const os = detectOS()
  const sql = query.uncheckedSql
  const sqlRef = useLatest<string>(sql)
  const onSqlCommitRef = useLatest(onSqlCommit)

  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const view = display?.view ?? 'table'
  const columns = Object.keys(result?.rows?.[0] ?? {})
  const rowLimit = query._tag === 'database' ? query.rowLimit : undefined
  const databaseIdentifier = query._tag === 'database' ? query.database_identifier : undefined

  const [promptInput, setPromptInput] = useState('')
  const [pendingRun, setPendingRun] = useState<{ sql: string; issues: PotentialIssues }>()
  const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null)
  const pendingProposalRef = useLatest(pendingProposal)

  const editorInstanceRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const [promptState, setPromptState] = useState<(EditorSelection & { isOpen: boolean }) | null>(
    null
  )

  const dialect = query._tag === 'logs' ? 'clickhouse' : 'postgres'
  const { requestCompletion, isCompletionLoading } = useQueryEditorAi({ dialect })

  const monaco = useMonaco()
  useAddDefinitions('', monaco, { enabled: dialect === 'postgres' })

  const { data: databases, isPending: isLoadingDatabases } = useReadReplicasQuery(
    { projectRef: project?.ref },
    {
      enabled:
        databaseIdentifier !== undefined &&
        project?.ref !== undefined &&
        databaseIdentifier !== project.ref,
    }
  )

  const connectionString =
    databaseIdentifier === undefined || databaseIdentifier === project?.ref
      ? project?.connectionString
      : databases?.find((database) => database.identifier === databaseIdentifier)?.connectionString

  const { data: eventTriggers } = useDatabaseEventTriggersQuery(
    { projectRef: project?.ref, connectionString },
    { enabled: query._tag === 'database' && isValidConnString(connectionString) }
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
  const handleRunQuery = async ({
    rawSql = sql,
    shouldForce = false,
  }: {
    rawSql?: string
    shouldForce?: boolean
  } = {}) => {
    if (!project || isBusy || pendingProposal || isRunDisabled || rawSql.trim().length === 0) return

    if (query._tag === 'database') {
      const issues = analyzeQueryIssues(rawSql, eventTriggers)
      if (hasBlockingIssues(issues, shouldForce)) {
        setPendingRun({ sql: rawSql, issues })
        return
      }
    }

    onRun?.()
    // [Joshen] This is deliberate to commit the sql, rather than the passed rawSql
    // As we want to save the cell's content into the store, rather than what's getting run
    onSqlCommit?.(sql)

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

  const handleConfirmPendingRun = () => {
    if (!pendingRun) return
    const runSql = pendingRun.sql
    setPendingRun(undefined)
    handleRunQuery({ rawSql: runSql, shouldForce: true })
  }

  const handleConfirmPendingRunWithRLS = () => {
    if (!pendingRun) return
    const tables = pendingRun.issues.createTablesMissingRLS ?? []
    if (tables.length === 0) return
    const rewrittenSql = appendEnableRLSStatements(pendingRun.sql, tables)
    setPendingRun(undefined)
    handleRunQuery({ rawSql: rewrittenSql, shouldForce: true })
  }

  const acceptSqlProposal = () => {
    if (isReadOnly || !pendingProposal) return
    if (sql === pendingProposal.original) {
      onSqlChange(pendingProposal.modified)
      onSqlCommit?.(pendingProposal.modified)
    }
    setPendingProposal(null)
  }

  const closePrompt = () => {
    setPromptState(null)
    setPromptInput('')
  }

  const handleEscapeKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    closePrompt()
    editorInstanceRef.current?.focus()
  })

  const handleGenerateSql = async (prompt: string) => {
    if (!promptState) return

    const { original, modified } = await requestCompletion(prompt, promptState)
    if (original !== undefined && modified !== undefined) {
      setPendingProposal({
        original,
        modified,
        label: 'Review the suggested SQL edit before accepting it',
        prompt,
      })
      closePrompt()
    }
  }

  const Shell = variant === 'viewport' ? ExplorerQueryViewport : ExplorerQuery

  useImperativeHandle(ref, () => ({
    run: (force = false) => handleRunQuery({ shouldForce: force }),
    getSql: () => sqlRef.current,
  }))

  useEffect(() => {
    if (!promptState?.isOpen) return
    const node = editorInstanceRef.current?.getDomNode()
    if (!node) return
    node.addEventListener('keydown', handleEscapeKey)
    return () => node.removeEventListener('keydown', handleEscapeKey)
  }, [promptState?.isOpen])

  return (
    <>
      <Shell className={cn(variant === 'embedded' && 'mx-auto max-w-6xl', className)}>
        <ExplorerToolbar>
          <ExplorerToolbarIcon>
            <CodeSquare size={14} />
          </ExplorerToolbarIcon>
          <ExplorerToolbarTitle onSaveTitle={onTitleChange}>{title}</ExplorerToolbarTitle>
          <ExplorerToolbarActions>
            {toolbarActions}
            {onSourceChange && (
              <QuerySourceMenu
                disabled={pendingProposal !== null}
                source={toQuerySourceBinding(query)}
                onSourceChange={(source) => {
                  setPendingProposal(null)
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
              disabled={pendingProposal !== null}
              tooltip={showQuery ? 'Hide query' : 'Show query'}
              onClick={() => onShowQueryChange(!showQuery)}
            />
            <ExplorerToolbarAction
              loading={isExecuting}
              icon={<Play />}
              tooltip="Run query"
              disabled={
                isBusy || pendingProposal !== null || isRunDisabled || sql.trim().length === 0
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
              onProposal={({ original, modified }) =>
                setPendingProposal({
                  original,
                  modified,
                  label: 'Review the ClickHouse SQL rewrite before accepting it',
                })
              }
              hidden={pendingProposal !== null}
            />
            <ExplorerQueryEditor
              className={cn('relative', variant === 'viewport' ? 'h-[45%] min-h-48' : undefined)}
            >
              <CodeEditor
                id={`explorer-query-${id}`}
                language="pgsql"
                isReadOnly={isReadOnly}
                value={sql}
                placeholder={!promptState?.isOpen ? generatePlaceholder(os) : ''}
                placeholderClassName="top-[13px]"
                className={variant === 'embedded' ? 'h-44' : undefined}
                actions={{
                  runQuery: { enabled: !isRunDisabled, callback: handleRunQuery },
                }}
                options={{
                  minimap: { enabled: false },
                  padding: { top: 8 },
                }}
                onInputChange={(value) => onSqlChange(value ?? '')}
                onMount={(editor, monaco) => {
                  editor.onDidBlurEditorWidget(() => onSqlCommitRef.current?.(sqlRef.current))
                  editorInstanceRef.current = editor

                  editor.addAction({
                    id: 'generate-sql',
                    label: 'Generate SQL',
                    keybindings: [
                      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK,
                    ],
                    run: () => {
                      if (pendingProposalRef.current) return
                      const selectionParts = getEditorSelectionParts(editor)
                      if (selectionParts) setPromptState({ isOpen: true, ...selectionParts })
                    },
                  })
                }}
              />

              {promptState?.isOpen && editorInstanceRef.current && !pendingProposal && (
                <ResizableAIWidget
                  editor={editorInstanceRef.current}
                  id={`explorer-ask-ai-${id}`}
                  value={promptInput}
                  onChange={setPromptInput}
                  onSubmit={handleGenerateSql}
                  onCancel={closePrompt}
                  isDiffVisible={false}
                  isLoading={isCompletionLoading}
                  startLineNumber={Math.max(0, promptState.startLineNumber)}
                  endLineNumber={promptState.endLineNumber}
                />
              )}

              {pendingProposal && (
                <div className="absolute inset-0 z-10 flex flex-col bg-studio">
                  <div className="flex items-center justify-between gap-2 border-b bg-surface-100 px-3 py-2">
                    <div>
                      <p className="text-xs text-foreground-light">{pendingProposal.label}</p>
                      {pendingProposal.prompt && (
                        <p className="text-xs text-foreground-lighter">
                          Prompt: {pendingProposal.prompt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="tiny"
                        onClick={() => setPendingProposal(null)}
                      >
                        Discard
                      </Button>
                      <Button variant="primary" size="tiny" onClick={acceptSqlProposal}>
                        Accept
                      </Button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1">
                    <DiffEditor
                      language="pgsql"
                      original={pendingProposal.original}
                      modified={pendingProposal.modified}
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

      {query._tag === 'database' && (
        <RunQueryWarningModal
          visible={!!pendingRun}
          potentialIssues={pendingRun?.issues}
          onCancel={() => setPendingRun(undefined)}
          onConfirm={handleConfirmPendingRun}
          onConfirmWithRLS={
            (pendingRun?.issues.createTablesMissingRLS?.length ?? 0) > 0
              ? handleConfirmPendingRunWithRLS
              : undefined
          }
        />
      )}
    </>
  )
})
