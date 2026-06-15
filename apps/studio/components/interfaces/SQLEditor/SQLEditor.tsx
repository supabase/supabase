import type { Monaco } from '@monaco-editor/react'
import {
  acceptUntrustedSql,
  rawSql,
  safeSql,
  type SafeSqlFragment,
  type UntrustedSqlFragment,
} from '@supabase/pg-meta'
import { wrapWithRollback } from '@supabase/pg-meta/src/query'
import { useQueryClient } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { ChevronUp, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import { RenameQueryModal } from './RenameQueryModal'
import { RunQueryWarningModal } from './RunQueryWarningModal'
import { ROWS_PER_PAGE_OPTIONS, sqlAiDisclaimerComment } from './SQLEditor.constants'
import {
  DiffType,
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
  type PotentialIssues,
} from './SQLEditor.types'
import {
  appendEnableRLSStatements,
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  hasActiveEnsureRLSTrigger,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import { getSqlSnippetSource, SqlSnippetSourceIcon } from './SQLEditorSource.utils'
import { useAddDefinitions } from './useAddDefinitions'
import { useCreateDraftSqlTab } from './useCreateDraftSqlTab'
import { useRestorePersistedDraftSqlTabs } from './useRestorePersistedDraftSqlTabs'
import { UtilityActions } from './UtilityPanel/UtilityActions'
import { UtilityPanel, type SqlOutputView } from './UtilityPanel/UtilityPanel'
import {
  isExplainQuery,
  isExplainSql,
  splitSqlStatements,
} from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from '@/components/interfaces/Settings/Logs/Logs.constants'
import { resolveLogDateRange } from '@/components/interfaces/Settings/Logs/logsDateRange'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import ResizableAIWidget from '@/components/ui/AIEditor/ResizableAIWidget'
import { GridFooter } from '@/components/ui/GridFooter'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
import { constructHeaders, isValidConnString } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import { useExecuteLogSqlMutation } from '@/data/logs/execute-log-sql-mutation'
import { acceptUntrustedLogSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { isError } from '@/data/utils/error-check'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { formatSql } from '@/lib/formatSql'
import { detectOS } from '@/lib/helpers'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
} from '@/state/role-impersonation-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { SqlSnippets } from '@/types'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('../../ui/DiffEditor').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

const getDefaultLogDateRange = (): SqlSnippets.LogDateRange => {
  const helper = getDefaultHelper(EXPLORER_DATEPICKER_HELPERS)

  return {
    from: helper.calcFrom(),
    to: helper.calcTo(),
    isHelper: true,
    text: helper.text,
  }
}

const formatLogQueryError = (error: unknown) => {
  if (typeof error === 'string') return { message: error }
  if (error && typeof error === 'object' && 'message' in error) return error
  return { message: 'Failed to run log query' }
}

export const SQLEditor = () => {
  const os = detectOS()
  const { ref, id: urlId } = useParams()

  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const queryClient = useQueryClient()
  const tabs = useTabsStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const showPrettyExplain = useFlag('ShowPrettyExplain')

  const {
    sourceSqlDiff,
    setSourceSqlDiff,
    selectedDiffType,
    setSelectedDiffType,
    setIsAcceptDiffLoading,
    isDiffOpen,
    defaultSqlDiff,
    closeDiff,
  } = useSqlEditorDiff()
  const { promptState, setPromptState, promptInput, setPromptInput, resetPrompt } =
    useSqlEditorPrompt()

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)
  const scrollTopRef = useRef<number>(0)
  const shouldRefocusAfterRunRef = useRef(false)

  const { createDraftTab } = useCreateDraftSqlTab()

  // Restore any open unsaved draft tabs from local storage on mount, and prune stale entries
  useRestorePersistedDraftSqlTabs()

  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])
  const [isDiffEditorMounted, setIsDiffEditorMounted] = useState(false)
  const [potentialIssues, setPotentialIssues] = useState<PotentialIssues>()

  const [showWidget, setShowWidget] = useState(false)
  const [activeOutputView, setActiveOutputView] = useState<SqlOutputView>('table')
  const [renameModalOpen, setRenameModalOpen] = useState(false)

  const refocusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => editorRef.current?.focus(), 0)
    })
  }, [])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_FOCUS_EDITOR, refocusEditor, {
    registerInCommandMenu: true,
  })

  const openNewSnippet = useCallback(() => {
    if (!ref) return
    // Open a fresh untitled draft tab (persisted only to local storage until the user saves it),
    // instead of immediately creating a snippet in the database.
    createDraftTab()
  }, [ref, createDraftTab])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_NEW_SNIPPET, openNewSnippet, {
    registerInCommandMenu: true,
  })

  const clearPendingRunRefocus = useCallback(() => {
    shouldRefocusAfterRunRef.current = false
  }, [])

  const refocusEditorAfterRunIfNeeded = useCallback(() => {
    if (!shouldRefocusAfterRunRef.current) return

    shouldRefocusAfterRunRef.current = false
    refocusEditor()
  }, [refocusEditor])

  // The id always comes from the URL now. `/sql/new` is resolved to a concrete draft id by the page
  // (pages/project/[ref]/sql/[id].tsx) which creates the draft and replaces the route, so while the
  // url is still `new` we render the loading state.
  const id = !urlId || urlId === 'new' ? '' : urlId

  const limit = snapV2.limit
  const results = snapV2.results[id]?.[0]
  const snippet = snapV2.snippets[id]?.snippet
  const snippetSource = getSqlSnippetSource(snippet)
  const defaultLogDateRange = useMemo(() => getDefaultLogDateRange(), [id])
  const logDateRange = snippet?.content?.logDateRange ?? defaultLogDateRange
  const snippetIsLoading = !(
    id in snapV2.snippets && snapV2.snippets[id].snippet.content !== undefined
  )
  const isLoading = !urlId || urlId === 'new' ? true : snippetIsLoading

  useAddDefinitions(id, monacoRef.current)

  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery(
    {
      projectRef: ref,
    },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const { data: eventTriggers } = useDatabaseEventTriggersQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: isValidConnString(project?.connectionString) }
  )

  /* React query mutations */
  const track = useTrack()
  const { mutate: execute, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess(data, vars) {
      if (id) {
        snapV2.addResult(id, data.result, vars.autoLimit)

        if (showPrettyExplain && isExplainQuery(data.result)) {
          snapV2.addExplainResult(id, data.result)
          setActiveOutputView('explain')
        } else if (activeOutputView === 'explain') {
          // If on Explain tab but ran a non-EXPLAIN query, switch to Results tab
          setActiveOutputView('table')
        }
      }

      // revalidate lint query
      queryClient.invalidateQueries({ queryKey: lintKeys.lint(ref) })
      refocusEditorAfterRunIfNeeded()
    },
    onError(error: any, vars) {
      if (id) {
        if (error.position && monacoRef.current) {
          const editor = editorRef.current
          const monaco = monacoRef.current

          const startLineNumber = hasSelection ? (editor?.getSelection()?.startLineNumber ?? 0) : 0

          const formattedError = error.formattedError ?? ''
          const lineError = formattedError.slice(formattedError.indexOf('LINE'))
          const line =
            startLineNumber + Number(lineError.slice(0, lineError.indexOf(':')).split(' ')[1])

          if (!isNaN(line)) {
            const decorations = editor?.deltaDecorations(
              [],
              [
                {
                  range: new monaco.Range(line, 1, line, 20),
                  options: {
                    isWholeLine: true,
                    inlineClassName: 'bg-warning-400',
                  },
                },
              ]
            )
            if (decorations) {
              editor?.revealLineInCenter(line)
              setLineHighlights(decorations)
            }
          }
        }

        snapV2.addResultError(id, error, vars.autoLimit)
      }

      refocusEditorAfterRunIfNeeded()
    },
  })

  const { mutate: executeLogs, isPending: isExecutingLogs } = useExecuteLogSqlMutation({
    onSuccess(data) {
      if (id) {
        if (data.error) {
          snapV2.addResultError(id, formatLogQueryError(data.error))
        } else {
          snapV2.addResult(id, data.result ?? [])
        }
        setActiveOutputView('table')
      }

      refocusEditorAfterRunIfNeeded()
    },
    onError(error) {
      if (id) {
        snapV2.addResultError(id, formatLogQueryError(error))
        setActiveOutputView('table')
      }

      refocusEditorAfterRunIfNeeded()
    },
  })

  const { mutate: executeExplain, isPending: isExplainExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) {
        snapV2.addExplainResult(id, data.result)
        setActiveOutputView('explain')
      }
    },
    onError(error) {
      if (id) {
        snapV2.addExplainResultError(id, error)
        setActiveOutputView('explain')
      }
    },
  })

  const prettifyQuery = useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]

    if (editorRef.current && project) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined
      const sql = snippet
        ? ((selectedValue || editorRef.current?.getValue()) ??
          snippet.snippet.content?.unchecked_sql)
        : selectedValue || editorRef.current?.getValue()
      const formattedSql = formatSql(sql)

      const editorModel = editorRef?.current?.getModel()
      if (editorRef.current && editorModel) {
        editorRef.current.executeEdits('apply-prettify-edit', [
          {
            text: formattedSql,
            range: editorModel.getFullModelRange(),
          },
        ])
        snapV2.setSql({ id, sql: formattedSql })
      }
    }
  }, [id, isDiffOpen, project, snapV2])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_FORMAT, prettifyQuery, {
    registerInCommandMenu: true,
  })

  const executeQuery = useCallback(
    async (force: boolean = false, sqlOverride?: SafeSqlFragment) => {
      if (isDiffOpen) {
        clearPendingRunRefocus()
        return
      }

      // use the latest state
      const state = getSqlEditorV2StateSnapshot()
      const snippet = state.snippets[id]
      const source = getSqlSnippetSource(snippet?.snippet)

      if (
        editorRef.current === null ||
        project === undefined ||
        (source === 'logs' ? isExecutingLogs : isExecuting)
      ) {
        clearPendingRunRefocus()
        return
      }

      const editor = editorRef.current
      const selection = editor.getSelection()
      const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined

      const editorSql = snippet
        ? ((selectedValue || editorRef.current?.getValue()) ??
          snippet.snippet.content?.unchecked_sql)
        : selectedValue || editorRef.current?.getValue()
      const sql = sqlOverride ?? editorSql

      if (source === 'logs') {
        const logSql = String(sql ?? '')
        if (!logSql.trim()) {
          clearPendingRunRefocus()
          return toast.error('Cannot run an empty log query')
        }

        if (lineHighlights.length > 0) {
          editor?.deltaDecorations(lineHighlights, [])
          setLineHighlights([])
        }

        const range = resolveLogDateRange(
          snippet?.snippet.content?.logDateRange ?? defaultLogDateRange
        )

        snapV2.resetExplainResult(id)
        executeLogs({
          projectRef: project.ref,
          sql: acceptUntrustedLogSql(untrustedLogSql(logSql)),
          iso_timestamp_start: range.from,
          iso_timestamp_end: range.to,
        })

        track('sql_editor_query_run_button_clicked')
        return
      }

      const hasDestructiveOperations = checkDestructiveQuery(sql)
      const hasUpdateWithoutWhere = isUpdateWithoutWhere(sql)
      const hasAlterDatabasePreventConnection = checkAlterDatabaseConnection(sql)
      const createTablesMissingRLS = filterTablesCoveredByEnsureRLSTrigger(
        getCreateTablesMissingRLS(sql),
        hasActiveEnsureRLSTrigger(eventTriggers)
      )

      const queryHasIssues =
        !force &&
        (hasDestructiveOperations ||
          hasUpdateWithoutWhere ||
          hasAlterDatabasePreventConnection ||
          createTablesMissingRLS.length > 0)

      if (queryHasIssues) {
        setPotentialIssues({
          hasDestructiveOperations,
          hasUpdateWithoutWhere,
          hasAlterDatabasePreventConnection,
          createTablesMissingRLS,
        })
        return
      }

      if (lineHighlights.length > 0) {
        editor?.deltaDecorations(lineHighlights, [])
        setLineHighlights([])
      }

      const impersonatedRoleState = getImpersonatedRoleState()
      const connectionString = databases?.find(
        (db) => db.identifier === databaseSelectorState.selectedDatabaseId
      )?.connectionString
      if (!isValidConnString(connectionString)) {
        clearPendingRunRefocus()
        return toast.error('Unable to run query: Connection string is missing')
      }

      const userSql = rawSql(sql)
      const { appendAutoLimit } = checkIfAppendLimitRequired(userSql, limit)
      const formattedSql = suffixWithLimit(userSql, limit)

      execute({
        projectRef: project.ref,
        connectionString: connectionString,
        sql: wrapWithRoleImpersonation(formattedSql, impersonatedRoleState),
        autoLimit: appendAutoLimit ? limit : undefined,
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
        isStatementTimeoutDisabled: true,
        contextualInvalidation: true,
        handleError: (error) => {
          throw error
        },
      })

      track('sql_editor_query_run_button_clicked')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      clearPendingRunRefocus,
      isDiffOpen,
      id,
      isExecuting,
      isExecutingLogs,
      project,
      execute,
      executeLogs,
      getImpersonatedRoleState,
      databaseSelectorState.selectedDatabaseId,
      databases,
      eventTriggers,
      limit,
      defaultLogDateRange,
      snapV2,
      track,
    ]
  )

  const executeQueryFromButton = useCallback(() => {
    shouldRefocusAfterRunRef.current = true
    refocusEditor()
    void executeQuery()
  }, [executeQuery, refocusEditor])

  const executeExplainQuery = useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]

    if (getSqlSnippetSource(snippet?.snippet) === 'logs') {
      setActiveOutputView('table')
      return
    }

    if (editorRef.current !== null && !isExplainExecuting && project !== undefined) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined

      const sql = snippet
        ? ((selectedValue || editorRef.current?.getValue()) ??
          snippet.snippet.content?.unchecked_sql)
        : selectedValue || editorRef.current?.getValue()

      // Check for multiple statements - EXPLAIN only works on a single statement
      const statements = splitSqlStatements(sql)
      if (statements.length > 1) {
        snapV2.addExplainResultError(id, {
          message:
            'EXPLAIN only works on a single SQL statement. Please select just one query to analyze.',
        })
        setActiveOutputView('explain')
        return
      }

      if (lineHighlights.length > 0) {
        editor?.deltaDecorations(lineHighlights, [])
        setLineHighlights([])
      }

      const impersonatedRoleState = getImpersonatedRoleState()
      const connectionString = databases?.find(
        (db) => db.identifier === databaseSelectorState.selectedDatabaseId
      )?.connectionString
      if (!isValidConnString(connectionString)) {
        return toast.error('Unable to run query: Connection string is missing')
      }

      // Wrap the query with EXPLAIN ANALYZE only if it's not already an EXPLAIN query
      const userSql = rawSql(sql ?? '')
      const explainSql = isExplainSql(sql) ? userSql : safeSql`EXPLAIN ANALYZE ${userSql}`

      // Wrap EXPLAIN queries in a transaction with rollback to prevent data modifications
      // This ensures EXPLAIN ANALYZE INSERT/UPDATE/DELETE queries don't actually modify data
      const explainSqlWithTransaction = wrapWithRollback(
        wrapWithRoleImpersonation(explainSql, impersonatedRoleState)
      )

      executeExplain({
        projectRef: project.ref,
        connectionString: connectionString,
        sql: explainSqlWithTransaction,
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
        handleError: (error) => {
          throw error
        },
      })
    }
  }, [
    isDiffOpen,
    id,
    isExplainExecuting,
    project,
    executeExplain,
    getImpersonatedRoleState,
    databaseSelectorState.selectedDatabaseId,
    databases,
    lineHighlights,
    snapV2,
  ])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_EXPLAIN, executeExplainQuery, {
    registerInCommandMenu: true,
  })

  const onMount = (editor: IStandaloneCodeEditor) => {
    const tabId = createTabId('sql', { id })
    const tabData = tabs.tabsMap[tabId]

    // [Joshen] Tiny timeout to give a bit of time for the content to load before scrolling
    setTimeout(() => {
      if (tabData?.metadata?.scrollTop) {
        editor.setScrollTop(tabData.metadata.scrollTop)
      }
    }, 20)
    editor.onDidScrollChange((e) => (scrollTopRef.current = e.scrollTop))
  }

  // Explicit save. Drafts open the rename dialog (which persists the snippet on confirm); already-saved
  // snippets save silently, exactly as before.
  const handleSave = useCallback(() => {
    if (!id) return

    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]?.snippet
    if (!snippet) return

    const sql = editorRef.current?.getValue() ?? ''
    if (!sql.trim()) {
      toast.error('Cannot save an empty query')
      return
    }

    if (snippet.isDraftTab) {
      // Flush the latest editor SQL into the draft's content before opening the rename dialog,
      // which performs the draft -> saved transition on confirm.
      snapV2.setSql({ id, sql, skipSave: true })
      setRenameModalOpen(true)
    } else {
      snapV2.setSql({ id, sql, shouldInvalidate: snippet.isNotSavedInDatabaseYet })
      snapV2.addNeedsSaving(id)
    }
  }, [id, snapV2])

  const handleSourceChange = useCallback(
    (source: SqlSnippets.Source) => {
      if (!id) return

      snapV2.setSnippetSource({ id, source })
      if (source === 'logs' && !snapV2.snippets[id]?.snippet.content?.logDateRange) {
        snapV2.setSnippetLogDateRange({ id, logDateRange: defaultLogDateRange })
      }

      snapV2.resetResults(id)
      if (source === 'logs' && activeOutputView === 'explain') {
        setActiveOutputView('table')
      }

      tabs.updateTab(createTabId('sql', { id }), { metadata: { sqlSource: source } })
    },
    [activeOutputView, defaultLogDateRange, id, snapV2, tabs]
  )

  const handleLogDateRangeChange = useCallback(
    (value: SqlSnippets.LogDateRange) => {
      if (!id) return
      snapV2.setSnippetLogDateRange({ id, logDateRange: value })
    },
    [id, snapV2]
  )

  const buildDebugPrompt = useCallback(() => {
    const snippet = snapV2.snippets[id]
    const result = snapV2.results[id]?.[0]
    const sql = (snippet?.snippet.content?.unchecked_sql ?? '')
      .replace(sqlAiDisclaimerComment, '')
      .trim()
    const errorMessage = result?.error?.message ?? 'Unknown error'
    const prompt = `Help me to debug the attached sql snippet which gives the following error: \n\n${errorMessage}`

    return `${prompt}\n\nSQL Query:\n\`\`\`sql\n${sql}\n\`\`\``
  }, [id, snapV2.results, snapV2.snippets])

  const onDebug = useCallback(async () => {
    try {
      const snippet = snapV2.snippets[id]
      const result = snapV2.results[id]?.[0]
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat({
        name: 'Debug SQL snippet',
        sqlSnippets: [
          (snippet.snippet.content?.unchecked_sql ?? '').replace(sqlAiDisclaimerComment, '').trim(),
        ],
        initialInput: `Help me to debug the attached sql snippet which gives the following error: \n\n${result.error.message}`,
      })
    } catch (error: unknown) {
      // [Joshen] There's a tendency for the SQL debug to chuck a lengthy error message
      // that's not relevant for the user - so we prettify it here by avoiding to return the
      // entire error body from the assistant
      if (isError(error)) {
        toast.error(
          `Sorry, the assistant failed to debug your query! Please try again with a different one.`
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, snapV2.results, snapV2.snippets])

  const acceptAiHandler = useCallback(async () => {
    try {
      setIsAcceptDiffLoading(true)

      // TODO: show error if undefined
      if (!sourceSqlDiff || !editorRef.current || !diffEditorRef.current) return

      const editorModel = editorRef.current.getModel()
      const diffModel = diffEditorRef.current.getModel()

      if (!editorModel || !diffModel) return

      const sql = diffModel.modified.getValue()

      if (selectedDiffType === DiffType.NewSnippet) {
        // Open AI-generated new queries as an unsaved draft instead of auto-creating a saved snippet
        createDraftTab({ initialSql: sql })
      } else {
        editorRef.current.executeEdits('apply-ai-edit', [
          {
            text: sql,
            range: editorModel.getFullModelRange(),
          },
        ])
      }

      track('assistant_sql_diff_handler_evaluated', { handlerAccepted: true })

      setSelectedDiffType(DiffType.Modification)
      resetPrompt()
      closeDiff()
    } finally {
      setIsAcceptDiffLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSqlDiff, selectedDiffType, createDraftTab, id, snapV2, track])

  const discardAiHandler = useCallback(() => {
    track('assistant_sql_diff_handler_evaluated', { handlerAccepted: false })
    resetPrompt()
    closeDiff()
  }, [closeDiff, resetPrompt, track])

  const [isCompletionLoading, setIsCompletionLoading] = useState<boolean>(false)

  const complete = useCallback(
    async (
      _prompt: string,
      options?: {
        headers?: Record<string, string>
        body?: { completionMetadata?: any }
      }
    ) => {
      try {
        setIsCompletionLoading(true)

        const response = await fetch(`${BASE_PATH}/api/ai/code/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
          },
          body: JSON.stringify({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            language: 'sql',
            orgSlug: org?.slug,
            ...(options?.body ?? {}),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to generate completion')
        }

        // API returns a JSON-encoded string
        const text: string = await response.json()

        const meta = options?.body?.completionMetadata ?? {}
        const beforeSelection: string = meta.textBeforeCursor ?? ''
        const afterSelection: string = meta.textAfterCursor ?? ''
        const selection: string = meta.selection ?? ''

        const original = beforeSelection + selection + afterSelection
        const modified = beforeSelection + text + afterSelection

        const formattedModified = formatSql(modified)
        setSourceSqlDiff({ original, modified: formattedModified })
        setSelectedDiffType(DiffType.Modification)
        setPromptState((prev) => ({ ...prev, isLoading: false }))
        setIsCompletionLoading(false)
      } catch (error: any) {
        toast.error(`Failed to generate SQL: ${error?.message ?? 'Unknown error'}`)
        setIsCompletionLoading(false)
        throw error
      }
    },
    [
      org?.slug,
      project?.connectionString,
      project?.ref,
      setPromptState,
      setSelectedDiffType,
      setSourceSqlDiff,
    ]
  )

  const handlePrompt = async (
    prompt: string,
    context: {
      beforeSelection: string
      selection: string
      afterSelection: string
    }
  ) => {
    try {
      setPromptState((prev) => ({
        ...prev,
        selection: context.selection,
        beforeSelection: context.beforeSelection,
        afterSelection: context.afterSelection,
      }))
      const headerData = await constructHeaders()

      const authorizationHeader = headerData.get('Authorization')

      await complete(prompt, {
        ...(authorizationHeader ? { headers: { Authorization: authorizationHeader } } : undefined),
        body: {
          completionMetadata: {
            textBeforeCursor: context.beforeSelection,
            textAfterCursor: context.afterSelection,
            language: 'pgsql',
            prompt,
            selection: context.selection,
          },
        },
      })
    } catch (error) {
      setPromptState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  /** All useEffects are at the bottom before returning the TSX */

  useEffect(() => {
    if (id) {
      closeDiff()
      setPromptState((prev) => ({ ...prev, isOpen: false }))
    }
    return () => {
      if (ref) {
        const tabId = createTabId('sql', { id })
        tabs.updateTab(tabId, { scrollTop: scrollTopRef.current })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeDiff, id])

  useEffect(() => {
    if (!id) return
    tabs.updateTab(createTabId('sql', { id }), { metadata: { sqlSource: snippetSource } })
    if (snippetSource === 'logs' && activeOutputView === 'explain') {
      setActiveOutputView('table')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, snippetSource])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDiffOpen && !promptState.isOpen) return

      switch (e.key) {
        case 'Enter':
          if ((os === 'macos' ? e.metaKey : e.ctrlKey) && isDiffOpen) {
            acceptAiHandler()
            resetPrompt()
          }
          return
        case 'Escape':
          if (isDiffOpen) discardAiHandler()
          resetPrompt()
          editorRef.current?.focus()
          return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [os, isDiffOpen, promptState.isOpen, acceptAiHandler, discardAiHandler, resetPrompt])

  useEffect(() => {
    if (isDiffOpen) {
      const diffEditor = diffEditorRef.current
      const model = diffEditor?.getModel()
      if (model && model.original && model.modified) {
        model.original.setValue(defaultSqlDiff.original)
        model.modified.setValue(defaultSqlDiff.modified)
        // scroll to the start line of the modification
        const modifiedEditor = diffEditor!.getModifiedEditor()
        const startLine = promptState.startLineNumber
        modifiedEditor.revealLineInCenter(startLine)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiffType, sourceSqlDiff])

  useEffect(() => {
    if (isSuccessReadReplicas) {
      const primaryDatabase = databases.find((db) => db.identifier === ref)
      databaseSelectorState.setSelectedDatabaseId(primaryDatabase?.identifier)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessReadReplicas, databases, ref])

  useEffect(() => {
    if (snapV2.diffContent !== undefined) {
      const { diffType, sql }: { diffType: DiffType; sql: string } = snapV2.diffContent
      const editorModel = editorRef.current?.getModel()
      if (!editorModel) return

      const existingValue = editorRef.current?.getValue() ?? ''
      if (existingValue.length === 0) {
        // if the editor is empty, just copy over the code
        editorRef.current?.executeEdits('apply-ai-message', [
          {
            text: `${sql}`,
            range: editorModel.getFullModelRange(),
          },
        ])
      } else {
        const currentSql = editorRef.current?.getValue()
        const diff = { original: currentSql || '', modified: sql }
        setSourceSqlDiff(diff)
        setSelectedDiffType(diffType)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapV2.diffContent])

  // We want to check if the diff editor is mounted and if it is, we want to show the widget
  // We also want to cleanup the widget when the diff editor is closed
  useEffect(() => {
    if (!isDiffOpen) {
      setIsDiffEditorMounted(false)
      setShowWidget(false)
    } else if (diffEditorRef.current && isDiffEditorMounted) {
      setShowWidget(true)
      return () => setShowWidget(false)
    }
  }, [isDiffOpen, isDiffEditorMounted])

  return (
    <>
      <RunQueryWarningModal
        visible={!!potentialIssues}
        potentialIssues={potentialIssues}
        onCancel={() => {
          clearPendingRunRefocus()
          setPotentialIssues(undefined)
          refocusEditor()
        }}
        onConfirm={() => {
          shouldRefocusAfterRunRef.current = true
          setPotentialIssues(undefined)
          refocusEditor()
          void executeQuery(true)
        }}
        onConfirmWithRLS={() => {
          const tables = potentialIssues?.createTablesMissingRLS ?? []
          if (tables.length === 0) return
          const editor = editorRef.current
          const selection = editor?.getSelection()
          const selectedValue = selection
            ? editor?.getModel()?.getValueInRange(selection)
            : undefined
          const baseSql = selectedValue || editor?.getValue() || ''
          const rewrittenSql = appendEnableRLSStatements(baseSql, tables)
          shouldRefocusAfterRunRef.current = true
          setPotentialIssues(undefined)
          refocusEditor()
          void executeQuery(true, acceptUntrustedSql(rewrittenSql as UntrustedSqlFragment))
        }}
      />

      <RenameQueryModal
        snippet={snapV2.snippets[id]?.snippet as any}
        visible={renameModalOpen}
        onCancel={() => setRenameModalOpen(false)}
        onComplete={() => setRenameModalOpen(false)}
      />

      <div className="flex h-full">
        <ResizablePanelGroup
          className="relative"
          orientation="vertical"
          autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
        >
          <ResizablePanel defaultSize="50" maxSize="70">
            <div className="grow border-b h-full flex flex-col overflow-hidden">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="animate-spin text-brand" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-x-4 px-4 min-h-[42px] border-b bg-surface-100">
                    <div className="flex items-center gap-x-2 min-w-0">
                      <SqlSnippetSourceIcon source={snippetSource} />
                      <span className="truncate text-sm text-foreground" title={snippet?.name}>
                        {snippet?.name ?? 'Untitled query'}
                      </span>
                    </div>

                    <UtilityActions
                      id={id}
                      isExecuting={snippetSource === 'logs' ? isExecutingLogs : isExecuting}
                      isDisabled={isDiffOpen}
                      hasSelection={hasSelection}
                      source={snippetSource}
                      logDateRange={logDateRange}
                      prettifyQuery={prettifyQuery}
                      executeQuery={executeQueryFromButton}
                      onSourceChange={handleSourceChange}
                      onLogDateRangeChange={handleLogDateRangeChange}
                      onSave={handleSave}
                    />
                  </div>

                  <div className="relative grow min-h-0">
                    {isDiffOpen && (
                      <div className="w-full h-full">
                        <DiffEditor
                          language="pgsql"
                          original={defaultSqlDiff.original}
                          modified={defaultSqlDiff.modified}
                          onMount={(editor) => {
                            diffEditorRef.current = editor
                            setIsDiffEditorMounted(true)
                          }}
                        />
                        {showWidget && (
                          <ResizableAIWidget
                            editor={diffEditorRef.current!}
                            id="ask-ai-diff"
                            value={promptInput}
                            onChange={setPromptInput}
                            onSubmit={(prompt: string) => {
                              handlePrompt(prompt, {
                                beforeSelection: promptState.beforeSelection,
                                selection: promptState.selection || defaultSqlDiff.modified,
                                afterSelection: promptState.afterSelection,
                              })
                            }}
                            onAccept={acceptAiHandler}
                            onReject={discardAiHandler}
                            onCancel={resetPrompt}
                            isDiffVisible={true}
                            isLoading={isCompletionLoading}
                            startLineNumber={Math.max(0, promptState.startLineNumber)}
                            endLineNumber={promptState.endLineNumber}
                          />
                        )}
                      </div>
                    )}
                    <div key={id} className="w-full h-full relative">
                      <MonacoEditor
                        autoFocus
                        placeholder={
                          !promptState.isOpen && !editorRef.current?.getValue()
                            ? 'Hit ' +
                              (os === 'macos' ? 'CMD+SHIFT+K' : `CTRL+SHIFT+K`) +
                              ' to generate query or just start typing'
                            : ''
                        }
                        id={id}
                        snippetName={snapV2.snippets[id]?.snippet.name ?? ''}
                        className={cn(isDiffOpen && 'hidden')}
                        editorRef={editorRef}
                        monacoRef={monacoRef}
                        executeQuery={executeQuery}
                        executeExplainQuery={executeExplainQuery}
                        prettifyQuery={prettifyQuery}
                        onSave={handleSave}
                        onHasSelection={setHasSelection}
                        onMount={onMount}
                        onPrompt={({
                          selection,
                          beforeSelection,
                          afterSelection,
                          startLineNumber,
                          endLineNumber,
                        }) => {
                          setPromptState((prev) => ({
                            ...prev,
                            isOpen: true,
                            selection,
                            beforeSelection,
                            afterSelection,
                            startLineNumber,
                            endLineNumber,
                          }))
                        }}
                      />
                      {editorRef.current && promptState.isOpen && !isDiffOpen && (
                        <ResizableAIWidget
                          editor={editorRef.current}
                          id="ask-ai"
                          value={promptInput}
                          onChange={setPromptInput}
                          onSubmit={(prompt: string) => {
                            handlePrompt(prompt, {
                              beforeSelection: promptState.beforeSelection,
                              selection: promptState.selection,
                              afterSelection: promptState.afterSelection,
                            })
                          }}
                          onCancel={resetPrompt}
                          isDiffVisible={false}
                          isLoading={isCompletionLoading}
                          startLineNumber={Math.max(0, promptState.startLineNumber)}
                          endLineNumber={promptState.endLineNumber}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="50" maxSize="70">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-brand" />
              </div>
            ) : (
              <UtilityPanel
                id={id}
                isExecuting={snippetSource === 'logs' ? isExecutingLogs : isExecuting}
                isExplainExecuting={isExplainExecuting}
                isDisabled={isDiffOpen}
                executeExplainQuery={executeExplainQuery}
                onDebug={onDebug}
                buildDebugPrompt={buildDebugPrompt}
                source={snippetSource}
                activeView={activeOutputView}
                onActiveViewChange={setActiveOutputView}
              />
            )}
          </ResizablePanel>

          <div className="h-9">
            {results?.rows !== undefined &&
              !(snippetSource === 'logs' ? isExecutingLogs : isExecuting) && (
                <GridFooter className="flex items-center justify-between gap-2">
                  <Tooltip>
                    <TooltipTrigger>
                      <p className="text-xs">
                        <span className="text-foreground">
                          {results.rows.length} row{results.rows.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-foreground-lighter ml-1">
                          {results.autoLimit !== undefined &&
                            ` (Limited to only ${results.autoLimit} rows)`}
                        </span>
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="flex flex-col gap-y-1">
                        <span>
                          Results are automatically limited to preserve browser performance, in
                          particular if your query returns an exceptionally large number of rows.
                        </span>

                        <span className="text-foreground-light">
                          You may change or remove this limit from the dropdown on the right
                        </span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {results.autoLimit !== undefined && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" iconRight={<ChevronUp size={14} />}>
                          Limit results to:{' '}
                          {ROWS_PER_PAGE_OPTIONS.find((opt) => opt.value === snapV2.limit)?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40" align="end">
                        <DropdownMenuRadioGroup
                          value={snapV2.limit.toString()}
                          onValueChange={(val) => snapV2.setLimit(Number(val))}
                        >
                          {ROWS_PER_PAGE_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.label}
                              value={option.value.toString()}
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </GridFooter>
              )}
          </div>
        </ResizablePanelGroup>
      </div>
    </>
  )
}
