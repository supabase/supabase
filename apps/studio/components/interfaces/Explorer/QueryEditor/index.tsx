import { useMonaco } from '@monaco-editor/react'
import { acceptUntrustedSql, untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useFlag } from 'common'
import { CodeSquare, Eye, EyeOff } from 'lucide-react'
import type { editor as monacoEditor, Selection } from 'monaco-editor'
import {
  forwardRef,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Button, cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

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
import { QueryRunButton } from './QueryRunButton'
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
import { getEditorValueOrSelection } from '@/components/ui/CodeEditor/CodeEditor.utils'
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
  /** Formats the editor's SQL in place and commits the result, same as the SQL Editor's Prettify SQL action. */
  prettify: () => Promise<void>
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
  /** Disables editor run actions and hides the toolbar run button (e.g. while an external confirm footer owns the run). */
  isRunDisabled?: boolean
  onTitleChange: (title: string) => void
  onSqlChange: (sql: string) => void
  onSqlCommit?: (sql: string) => void
  onSourceChange?: (source: QuerySourceBinding) => void
  onResultChange: (result: QueryResult) => void
  onRowLimitChange?: (val: number) => void
  onDisplayChange?: (display: QueryDisplay) => void
  onRun?: () => void
  /** Receives the "Debug with Assistant" prompt on error. Defaults to opening a new assistant chat. */
  onDebug?: (prompt: string) => void
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
    onDebug,
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

  const { x_column, y_series } = display?.chart ?? {}
  const hasConfig = !!x_column && (y_series ?? []).length > 0

  const [promptInput, setPromptInput] = useState('')
  const [pendingRun, setPendingRun] = useState<{ sql: string; issues: PotentialIssues }>()
  const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null)
  const pendingProposalRef = useLatest(pendingProposal)

  const editorInstanceRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const [promptState, setPromptState] = useState<(EditorSelection & { isOpen: boolean }) | null>(
    null
  )
  const [hasSelection, setHasSelection] = useState(false)

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
    onError: () => {},
  })

  const { mutateAsync: executeLogsSql, isPending: isExecutingLogs } = useExecuteLogsSqlMutation({
    onError: () => {},
  })

  const isResolvingDatabase =
    databaseIdentifier !== undefined && databaseIdentifier !== project?.ref && isLoadingDatabases
  const isExecuting = isExecutingSql || isExecutingLogs
  const isBusy = isLoadingProject || isResolvingDatabase || isExecuting

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
    const querySnapshot = { sql: rawSql, source: query._tag }
    // [Joshen] This is deliberate to commit the sql, rather than the passed rawSql
    // As we want to save the cell's content into the store, rather than what's getting run
    onSqlCommit?.(sql)

    if (query._tag === 'logs') {
      if (!isOtelLogsEnabled) {
        onResultChange({
          error: { message: "Querying logs isn't available for this project yet." },
          ...querySnapshot,
        })
        return
      }

      await executeLogsSql({
        projectRef: project.ref,
        sql: acceptUntrustedLogsSql(untrustedLogSql(rawSql)),
        range: resolveLogTimeRange(query.time_range),
        endpoint: QUERY_SOURCE_REGISTRY.logs.endpoint,
      }).then(
        (data) =>
          onResultChange({
            rows: data.rows as readonly Record<string, unknown>[],
            ...querySnapshot,
          }),
        (error) => onResultChange({ error, ...querySnapshot })
      )
      return
    }

    const safeSql = acceptUntrustedSql(untrustedSql(rawSql))
    const limitedSql = applyAutoLimit(safeSql, rowLimit)

    if (!isValidConnString(connectionString)) {
      onResultChange({
        error: { message: 'Unable to run query: Connection string is missing' },
        ...querySnapshot,
      })
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
    }).then(
      (data) => onResultChange({ rows: data.result, ...querySnapshot }),
      (error) => onResultChange({ error, ...querySnapshot })
    )
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
  const isResizableSplit = variant === 'viewport' && showQuery

  const handlePrettify = async () => {
    if (pendingProposalRef.current) return

    const editor = editorInstanceRef.current
    if (!editor) return
    await editor.getAction('editor.action.formatDocument')?.run()
    onSqlCommitRef.current?.(editor.getValue())
  }

  useImperativeHandle(ref, () => ({
    run: (force = false) => handleRunQuery({ shouldForce: force }),
    getSql: () => sqlRef.current,
    prettify: handlePrettify,
  }))

  useEffect(() => {
    if (!promptState?.isOpen) return
    const node = editorInstanceRef.current?.getDomNode()
    if (!node) return
    node.addEventListener('keydown', handleEscapeKey)
    return () => node.removeEventListener('keydown', handleEscapeKey)
  }, [promptState?.isOpen])

  const shouldCenterResults =
    !result?.error && ((result?.rows ?? []).length === 0 || (view === 'chart' && !hasConfig))

  const queryResults = (
    <ExplorerQueryResults
      className={cn(
        variant === 'embedded' ? 'max-h-80' : 'h-full',
        shouldCenterResults ? 'items-center justify-center' : 'overflow-x-auto'
      )}
    >
      <QueryResultRenderer
        view={view}
        result={result}
        chart={display?.chart}
        sql={result?.sql}
        source={result?.source}
        onDebug={onDebug}
      />
    </ExplorerQueryResults>
  )

  const querySql = showQuery ? (
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
        className={cn('relative', isResizableSplit && 'h-full min-h-0 flex-1 border-b-0')}
      >
        <CodeEditor
          id={`explorer-query-${id}`}
          language="pgsql"
          isReadOnly={isReadOnly}
          value={sql}
          placeholder={!promptState?.isOpen ? generatePlaceholder(os) : ''}
          placeholderClassName="top-[13px]"
          className={isResizableSplit ? undefined : 'h-44'}
          actions={{
            runQuery: {
              enabled: !isRunDisabled,
              callback: (rawSql: string) => handleRunQuery({ rawSql }),
            },
          }}
          options={{
            minimap: { enabled: false },
            padding: { top: 8 },
          }}
          onInputChange={(value) => onSqlChange(value ?? '')}
          onMount={(editor, monaco) => {
            editor.onDidBlurEditorWidget(() => onSqlCommitRef.current?.(sqlRef.current))
            editorInstanceRef.current = editor

            const updateHasSelection = (selection: Selection | null | undefined) => {
              const noSelection =
                !selection ||
                (selection.startLineNumber === selection.endLineNumber &&
                  selection.startColumn === selection.endColumn)
              setHasSelection(!noSelection)
            }

            // A remount (e.g. toggling "Show query" off then on) creates a fresh
            // editor with no listener history, so `hasSelection` must be read from
            // this instance directly rather than left at whatever the previous
            // editor instance last reported.
            updateHasSelection(editor.getSelection())
            editor.onDidChangeCursorSelection(({ selection }) => updateHasSelection(selection))

            editor.addAction({
              id: 'generate-sql',
              label: 'Generate SQL',
              keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK],
              run: () => {
                if (pendingProposalRef.current) return
                const selectionParts = getEditorSelectionParts(editor)
                if (selectionParts) setPromptState({ isOpen: true, ...selectionParts })
              },
            })

            editor.addAction({
              id: 'prettify-query',
              label: 'Prettify SQL',
              keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
              contextMenuGroupId: 'operation',
              run: () => {
                handlePrettify()
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
                <Button variant="default" size="tiny" onClick={() => setPendingProposal(null)}>
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
  ) : null

  return (
    <>
      <Shell className={cn(variant === 'embedded' && 'mx-auto max-w-6xl', className)}>
        <ExplorerToolbar className={cn(variant === 'viewport' && 'px-4')}>
          <ExplorerToolbarIcon>
            <CodeSquare size={16} strokeWidth={2} />
          </ExplorerToolbarIcon>
          {variant === 'viewport' ? (
            <ExplorerToolbarTitle className="text-muted text-xs italic">
              Run SQL
            </ExplorerToolbarTitle>
          ) : (
            <ExplorerToolbarTitle onSaveTitle={onTitleChange}>{title}</ExplorerToolbarTitle>
          )}
          <ExplorerToolbarActions>
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
              icon={
                showQuery ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />
              }
              disabled={pendingProposal !== null}
              tooltip={showQuery ? 'Hide query' : 'Show query'}
              onClick={() => onShowQueryChange(!showQuery)}
            />

            {toolbarActions}

            {!isRunDisabled && (
              <QueryRunButton
                isExecuting={isExecuting}
                disabled={isBusy || pendingProposal !== null || sql.trim().length === 0}
                hasSelection={showQuery && hasSelection}
                onRun={() => handleRunQuery({ rawSql: sql })}
                onRunSelected={() => {
                  const editorInstance = editorInstanceRef.current
                  const rawSql = editorInstance ? getEditorValueOrSelection(editorInstance) : sql
                  handleRunQuery({ rawSql })
                }}
              />
            )}
          </ExplorerToolbarActions>
        </ExplorerToolbar>

        {isResizableSplit ? (
          <ResizablePanelGroup orientation="vertical" className="relative h-0 min-h-0 flex-1">
            <ResizablePanel defaultSize="40" maxSize="70">
              <div className="flex h-full min-h-0 flex-col overflow-hidden">{querySql}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="60" maxSize="70">
              <div className="flex h-full min-h-0 flex-col overflow-hidden">{queryResults}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <>
            {querySql}
            {queryResults}
          </>
        )}

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
