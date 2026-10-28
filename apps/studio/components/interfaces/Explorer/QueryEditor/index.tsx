import { useMonaco } from '@monaco-editor/react'
import {
  acceptUntrustedSql,
  literal,
  safeSql,
  untrustedSql,
  type SafeSqlFragment,
  type UntrustedSqlFragment,
} from '@supabase/pg-meta'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'
import type { ExplorerQueryLocation } from 'common/telemetry-constants'
import { cloneDeep } from 'lodash'
import { CodeSquareIcon, EyeIcon, EyeOffIcon, PanelRightIcon } from 'lucide-react'
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
import { toast } from 'sonner'
import { Button, cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import { z } from 'zod'

import { resolveLogTimeRange } from '../../QuerySources/LogTimeRange.utils'
import { buildEntitySelectSql, type QueryEntityBinding } from '../entityQuery.utils'
import {
  ExplorerQuery,
  ExplorerQueryEditor,
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
import { PendingChangesPanel } from './PendingChangesPanel'
import { QueryDetailsPanel } from './QueryDetailsPanel'
import { QueryResultEditsBar } from './QueryResultEditsBar'
import { QueryResultFooter } from './QueryResultFooter'
import { QueryResultRenderer } from './QueryResultRenderer'
import { QueryResultRowEditor } from './QueryResultRowEditor'
import { QueryRunButton } from './QueryRunButton'
import { QuerySourceMenu } from './QuerySourceMenu'
import { RowDetailsPanel } from './RowDetailsPanel'
import { useQueryEditorAi } from './useQueryEditorAi'
import { useQueryResultEditing } from './useQueryResultEditing'
import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'
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
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { isValidConnString, unguarded } from '@/data/fetchers'
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
import { executeSql, useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { parsedQueryQueryOptions } from '@/data/sql/parsed-query-query'
import { applyAutoLimit } from '@/data/sql/utils'
import { useDebouncedValue } from '@/hooks/misc/useDebouncedValue'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'
import { detectOS } from '@/lib/helpers'
import { getQueryLabel } from '@/lib/query-relations'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
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
      /** Set when this query was opened from a database object rather than typed. */
      entity?: QueryEntityBinding
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
  /** The last result this cell produced in this session, or undefined if it hasn't been run. */
  getResult: () => QueryResult | undefined
}

type QueryEditorProps = {
  id: string
  location?: ExplorerQueryLocation
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
  /**
   * Runs the query once on open, without waiting for the user to hit Run — for a surface
   * whose whole point is the rows, such as a table opened from the sidebar.
   *
   * Honored only while the query still holds exactly the SQL its `entity` generates. An
   * automatic run has no gesture behind it to approve the editor's untrusted text, so the
   * SQL that runs is rebuilt from the binding instead of promoted from the buffer.
   */
  autoRun?: boolean
  onTitleChange: (title: string) => void
  onSqlChange: (sql: string) => void
  onSqlCommit?: (sql: string) => void
  onSourceChange?: (source: QuerySourceBinding) => void
  onResultChange: (result: QueryResult) => void
  onRowLimitChange?: (val: number) => void
  onDisplayChange?: (display: QueryDisplay) => void
  onRun?: () => void
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
    location,
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
    autoRun = false,
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
  const track = useTrack()
  const sql = query.uncheckedSql
  const sqlRef = useLatest<string>(sql)
  const onSqlCommitRef = useLatest(onSqlCommit)
  const resultRef = useLatest(result)

  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const view = display?.view ?? 'table'
  const columns = Object.keys(result?.rows?.[0] ?? {})
  const rowLimit = query._tag === 'database' ? query.rowLimit : undefined
  const databaseIdentifier = query._tag === 'database' ? query.database_identifier : undefined
  const resultsRowCount = (result?.rows ?? []).length

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

  const { grant: queryGrant } = useGrant('POST /platform/pg-meta/{ref}/query', {
    projectRef: project?.ref,
  })

  const { mutateAsync: runSql, isPending: isExecutingSql } = useExecuteSqlMutation({
    onError: () => {},
  })

  const { mutateAsync: executeLogsSql, isPending: isExecutingLogs } = useExecuteLogsSqlMutation({
    onError: () => {},
  })

  const isResolvingDatabase =
    databaseIdentifier !== undefined && databaseIdentifier !== project?.ref && isLoadingDatabases
  const isExecuting = isExecutingSql || isExecutingLogs
  const isBusy = isLoadingProject || isResolvingDatabase || isExecuting

  const editing = useQueryResultEditing({
    result,
    isEnabled: !isReadOnly && !isRunDisabled && !isBusy,
    roleImpersonationState: roleImpersonationState
      ? { role: roleImpersonationState.role, claims: roleImpersonationState.claims }
      : undefined,
    onResultChange,
  })

  /**
   * Runs SQL that has already cleared the untrusted boundary — promoted by a run gesture in
   * `handleRunQuery`, or generated by Studio itself for an automatic run. Splitting it out is
   * what lets the automatic path execute without ever promoting the editor's buffer.
   */
  const executeDatabaseSql = async (
    safeSql: SafeSqlFragment,
    querySnapshot: { sql: string; source: 'database' | 'logs' },
    onSettled?: (failureReason?: 'connection_unavailable' | 'execution_error') => void
  ) => {
    if (!project) return

    const editingContext = {
      projectRef: project.ref,
      databaseIdentifier,
      roleImpersonationState: roleImpersonationState
        ? cloneDeep({ role: roleImpersonationState.role, claims: roleImpersonationState.claims })
        : undefined,
    }
    const limitedSql = applyAutoLimit(safeSql, rowLimit)
    // Edits name their rows by primary key, so they still apply to a refined re-run.
    const pendingEdits = resultRef.current?.pendingEdits

    if (!isValidConnString(connectionString)) {
      onSettled?.('connection_unavailable')
      onResultChange({
        error: { message: 'Unable to run query: Connection string is missing' },
        ...querySnapshot,
        pendingEdits,
      })
      return
    }

    await runSql({
      projectRef: project.ref,
      connectionString,
      sql: wrapWithRoleImpersonation(limitedSql.sql, roleImpersonationState),
      autoLimit: limitedSql.appendAutoLimit ? rowLimit : undefined,
      contextualInvalidation: true,
      isStatementTimeoutDisabled: true,
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
      grant: unguarded.migrating,
    }).then(
      (data) => {
        onSettled?.()
        onResultChange({
          rows: data.result,
          ...querySnapshot,
          editingContext,
          pendingEdits,
          // A full page under the auto limit means there may be more rows to load.
          canLoadMore:
            limitedSql.appendAutoLimit &&
            rowLimit !== undefined &&
            rowLimit > 0 &&
            data.result.length >= rowLimit,
        })
      },
      (error) => {
        onSettled?.('execution_error')
        onResultChange({ error, ...querySnapshot, pendingEdits })
      }
    )
  }

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
    const runProperties = location
      ? { ...location, runId: crypto.randomUUID(), source: query._tag }
      : undefined
    const groups = { project: project.ref }

    if (runProperties) track('explorer_query_submitted', runProperties, groups)

    const trackRunResult = (
      failureReason?: 'logs_unavailable' | 'connection_unavailable' | 'execution_error'
    ) => {
      if (!runProperties) return
      if (failureReason) {
        track('explorer_query_failed', { ...runProperties, failureReason }, groups)
      } else {
        track('explorer_query_completed', runProperties, groups)
      }
    }

    // [Joshen] This is deliberate to commit the sql, rather than the passed rawSql
    // As we want to save the cell's content into the store, rather than what's getting run
    onSqlCommit?.(sql)

    if (query._tag === 'logs') {
      if (!isOtelLogsEnabled) {
        trackRunResult('logs_unavailable')
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
        (data) => {
          trackRunResult()
          onResultChange({
            rows: data.rows as readonly Record<string, unknown>[],
            ...querySnapshot,
          })
        },
        (error) => {
          trackRunResult('execution_error')
          onResultChange({ error, ...querySnapshot })
        }
      )
      return
    }

    await executeDatabaseSql(
      acceptUntrustedSql(untrustedSql(rawSql)),
      querySnapshot,
      trackRunResult
    )
  }

  /**
   * The SQL an entity-backed query generates, rebuilt from the binding rather than read from
   * the editor. `autoRun` is honored only while the two still match: once the user edits the
   * query it is their own untrusted text, which may not run without a gesture.
   */
  const generatedSql =
    query._tag === 'database' && query.entity ? buildEntitySelectSql(query.entity) : undefined
  // Compared trimmed, which also drops the branding both sides carry — the point is whether
  // the text on screen is still the text Studio generated.
  const isGeneratedQuery = generatedSql !== undefined && generatedSql.trim() === sql.trim()
  const canAutoRun = autoRun && isGeneratedQuery

  const runGeneratedQueryRef = useLatest(() => {
    if (generatedSql === undefined) return
    // No blocking-issue check: `generatedSql` is a plain select Studio built itself, and a
    // confirmation modal has no meaning on a run the user did not ask for.
    onRun?.()
    executeDatabaseSql(generatedSql, { sql: generatedSql, source: 'database' })
  })

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

  // The sidebar describes database objects and reviews result edits, and needs the width a
  // full tab gives it.
  const { showDetails, setShowDetails } = useExplorerPreferences()
  const canShowSidebar = variant === 'viewport' && query._tag === 'database'
  const hasPendingEdits = editing.pendingEdits.length > 0
  const [isReviewRequested, setIsReviewRequested] = useState(false)
  // Once the edits are saved or discarded there's nothing left to review, so the next edit
  // starts with the sidebar as the user had it rather than reopening the review.
  const [hadPendingEdits, setHadPendingEdits] = useState(hasPendingEdits)
  if (hadPendingEdits !== hasPendingEdits) {
    setHadPendingEdits(hasPendingEdits)
    if (!hasPendingEdits) setIsReviewRequested(false)
  }
  const isReviewingChanges = canShowSidebar && isReviewRequested && hasPendingEdits
  const isDetailsOpen = canShowSidebar && showDetails && !isReviewingChanges

  // The row the details describe, named by primary key so it survives edits and re-runs; once
  // a result no longer has it, the details fall back to the table.
  const [selectedRowKey, setSelectedRowKey] = useState<{
    tableId: number
    rowIdentifiers: Record<string, unknown>
  }>()
  const [isRowEditorOpen, setIsRowEditorOpen] = useState(false)
  const target = editing.target
  const selectedRow =
    selectedRowKey && target?.table.id === selectedRowKey.tableId
      ? editing.findRow(selectedRowKey.rowIdentifiers)
      : undefined
  const selectedRowDetails =
    selectedRow && selectedRowKey && target
      ? {
          relation: {
            id: target.table.id,
            schema: target.table.schema,
            name: target.table.name,
            type: ENTITY_TYPE.TABLE,
          },
          row: selectedRow,
          rowIdentifiers: selectedRowKey.rowIdentifiers,
        }
      : undefined

  const handleSelectedRowChange = (row: Record<string, unknown> | undefined) => {
    const rowIdentifiers = row ? editing.getRowIdentifiers(row) : null
    setSelectedRowKey(
      rowIdentifiers && target ? { tableId: target.table.id, rowIdentifiers } : undefined
    )
  }
  // Follows the results on screen; before a first run, a query opened from a table already
  // knows what it will read.
  const detailsSql = (result?.source === 'database' ? result.sql : undefined) ?? generatedSql

  // A full tab is titled for what its query does, read from the editor once typing pauses.
  const labelSql = useDebouncedValue(sql, 500).trim()
  const canLabelQuery = variant === 'viewport' && query._tag === 'database' && labelSql.length > 0
  const { data: parsedQuery } = useQuery({
    ...parsedQueryQueryOptions({ sql: canLabelQuery ? labelSql : undefined }),
    placeholderData: keepPreviousData,
  })
  const queryLabel = canLabelQuery && parsedQuery ? getQueryLabel(parsedQuery) : undefined

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
    getResult: () => result,
  }))

  // Runs once per query, and only once the project has resolved — the same conditions that
  // enable the Run button. Skipped when a result is already in hand, so returning to an open
  // tab shows what it had rather than re-querying.
  const autoRunKeyRef = useRef<string>(undefined)
  const isReadyToAutoRun =
    canAutoRun && project !== undefined && result === undefined && !isBusy && !isRunDisabled

  useEffect(() => {
    if (!isReadyToAutoRun || autoRunKeyRef.current === id) return

    autoRunKeyRef.current = id
    runGeneratedQueryRef.current()
  }, [isReadyToAutoRun, id, runGeneratedQueryRef])

  useEffect(() => {
    if (!promptState?.isOpen) return
    const node = editorInstanceRef.current?.getDomNode()
    if (!node) return
    node.addEventListener('keydown', handleEscapeKey)
    return () => node.removeEventListener('keydown', handleEscapeKey)
  }, [promptState?.isOpen])

  const queryResults = (
    <ExplorerQueryResults className={cn(variant === 'embedded' ? 'max-h-80' : 'h-full')}>
      <QueryResultRenderer
        view={view}
        result={result}
        chart={display?.chart}
        sql={result?.sql}
        source={result?.source}
        onDebug={onDebug}
        editing={editing}
        // A query that runs itself is as good as running from the moment it opens.
        isRunning={isExecuting || (canAutoRun && result === undefined && !isRunDisabled)}
        rowSelection={
          canShowSidebar
            ? {
                selectedRow: isDetailsOpen ? selectedRow : undefined,
                onSelectedRowChange: handleSelectedRowChange,
                onViewRow: (row) => {
                  handleSelectedRowChange(row)
                  setIsReviewRequested(false)
                  setShowDetails(true)
                },
              }
            : undefined
        }
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
            scrollBeyondLastLine: true,
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
                <Button size="tiny" onClick={() => setPendingProposal(null)}>
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

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const handleLoadMore = async () => {
    const current = resultRef.current
    if (
      !project ||
      !queryGrant ||
      generatedSql === undefined ||
      !current?.rows ||
      rowLimit === undefined ||
      rowLimit <= 0 ||
      !isValidConnString(connectionString)
    )
      return

    const role = current.editingContext?.roleImpersonationState
    setIsLoadingMore(true)
    try {
      const { result: page } = await executeSql({
        projectRef: project.ref,
        connectionString,
        sql: wrapWithRoleImpersonation(
          safeSql`${generatedSql} limit ${literal(rowLimit)} offset ${literal(current.rows.length)}`,
          role
        ),
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(role?.role),
        grant: queryGrant,
      })
      const rows = z.array(z.record(z.unknown())).parse(page)
      // A new run may have replaced the result while this page loaded.
      const latest = resultRef.current
      if (latest !== current || !latest.rows) return
      onResultChange({
        ...latest,
        rows: [...latest.rows, ...rows],
        canLoadMore: rows.length >= rowLimit,
      })
    } catch (error) {
      toast.error(
        `Failed to load more rows: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  const queryBody = (
    <>
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

      {editing.pendingEdits.length > 0 ? (
        <QueryResultEditsBar editing={editing} isShortcutEnabled={variant === 'viewport'} />
      ) : (
        <QueryResultFooter
          results={result?.rows}
          count={resultsRowCount}
          rowLimit={rowLimit}
          fileName={title}
          onLoadMore={
            // Paging appends to the generated query, so it's offered only while the editor
            // still holds it; a rewritten query is the user's to page with SQL.
            isGeneratedQuery && result?.canLoadMore && !isBusy ? handleLoadMore : undefined
          }
          isLoadingMore={isLoadingMore}
        />
      )}
    </>
  )

  return (
    <>
      <Shell className={className}>
        <ExplorerToolbar className={cn(variant === 'viewport' && 'px-4')}>
          <ExplorerToolbarIcon>
            <CodeSquareIcon size={16} strokeWidth={2} />
          </ExplorerToolbarIcon>
          {variant === 'viewport' ? (
            <ExplorerToolbarTitle
              className={cn('text-xs', queryLabel ? 'text-foreground-light' : 'text-muted italic')}
            >
              {queryLabel ?? 'Run SQL'}
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
                showQuery ? (
                  <EyeOffIcon size={16} strokeWidth={2} />
                ) : (
                  <EyeIcon size={16} strokeWidth={2} />
                )
              }
              aria-label={showQuery ? 'Hide query' : 'Show query'}
              disabled={pendingProposal !== null}
              tooltip={showQuery ? 'Hide query' : 'Show query'}
              onClick={() => onShowQueryChange(!showQuery)}
            />

            {canShowSidebar && (
              <ExplorerToolbarAction
                icon={<PanelRightIcon size={16} strokeWidth={2} />}
                aria-label={isDetailsOpen ? 'Hide details' : 'Show details'}
                aria-pressed={isDetailsOpen}
                tooltip={isDetailsOpen ? 'Hide details' : 'Show details'}
                className={cn(isDetailsOpen && 'text-foreground')}
                onClick={() => {
                  setIsReviewRequested(false)
                  setShowDetails(!isDetailsOpen)
                }}
              />
            )}

            {toolbarActions}

            {canShowSidebar && hasPendingEdits && (
              <Button
                variant={isReviewingChanges ? 'default' : 'outline'}
                size="tiny"
                className="mx-1"
                aria-pressed={isReviewingChanges}
                onClick={() => setIsReviewRequested(!isReviewingChanges)}
              >
                Review changes
              </Button>
            )}

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

        {canShowSidebar ? (
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
            <ResizablePanel id="explorer-query-main">
              <div className="flex h-full min-h-0 min-w-0 flex-col">{queryBody}</div>
            </ResizablePanel>
            {(isReviewingChanges || isDetailsOpen) && (
              <>
                <ResizableHandle withHandle />
                {/* Same bounds as the Explorer sidebar on the other side. */}
                <ResizablePanel
                  id="explorer-query-sidebar"
                  minSize={256}
                  maxSize={512}
                  defaultSize={288}
                >
                  {isReviewingChanges && <PendingChangesPanel editing={editing} />}
                  {isDetailsOpen && selectedRowDetails && (
                    <RowDetailsPanel
                      {...selectedRowDetails}
                      onBack={() => setSelectedRowKey(undefined)}
                      onRowDeleted={() => {
                        editing.removeRow(selectedRowDetails.rowIdentifiers)
                        setSelectedRowKey(undefined)
                      }}
                      onEdit={editing.canEdit ? () => setIsRowEditorOpen(true) : undefined}
                    />
                  )}
                  {isDetailsOpen && !selectedRowDetails && (
                    <QueryDetailsPanel
                      sql={detailsSql}
                      onRowAdded={(relation, row) => editing.addRow(relation.id, row)}
                    />
                  )}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        ) : (
          queryBody
        )}
      </Shell>

      {isRowEditorOpen && editing.canEdit && target && selectedRowKey && project && (
        <QueryResultRowEditor
          projectRef={project.ref}
          connectionString={project.connectionString}
          table={target.table}
          identifiers={selectedRowKey.rowIdentifiers}
          pendingEdits={editing.pendingEdits}
          roleImpersonationState={result?.editingContext?.roleImpersonationState}
          onClose={() => setIsRowEditorOpen(false)}
          onStage={(row, changes) => {
            editing.stageRowEdits(selectedRowKey.rowIdentifiers, row, changes)
            setIsRowEditorOpen(false)
          }}
        />
      )}

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
