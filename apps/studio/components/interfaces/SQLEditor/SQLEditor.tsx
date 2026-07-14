import {
  acceptUntrustedSql,
  untrustedSql,
  type SafeSqlFragment,
  type UntrustedSqlFragment,
} from '@supabase/pg-meta'
import { useQueryClient } from '@tanstack/react-query'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { toast } from 'sonner'
import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import { RunQueryWarningModal } from './RunQueryWarningModal'
import { sqlAiDisclaimerComment, untitledSnippetTitle } from './SQLEditor.constants'
import { DiffType, type PotentialIssues } from './SQLEditor.types'
import {
  appendEnableRLSStatements,
  assembleCompletionDiff,
  buildDebugPromptText,
  buildExplainSql,
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  createSqlSnippetSkeletonV2,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  hasActiveEnsureRLSTrigger,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import { SQLEditorProvider, useSQLEditorContext } from './SQLEditorContext'
import { useAddDefinitions } from './useAddDefinitions'
import { useEditorMount } from './useEditorMount'
import { usePrettifyQuery } from './usePrettifyQuery'
import { useSnippetIdentity } from './useSnippetIdentity'
import { useSnippetTitleGenerator } from './useSnippetTitleGenerator'
import { UtilityActions } from './UtilityPanel/UtilityActions'
import { UtilityPanel } from './UtilityPanel/UtilityPanel'
import {
  isExplainQuery,
  splitSqlStatements,
} from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import ResizableAIWidget from '@/components/ui/AIEditor/ResizableAIWidget'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
import { constructHeaders, isValidConnString } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { isError } from '@/data/utils/error-check'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { formatSql } from '@/lib/formatSql'
import { detectOS } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'
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
import { useSqlEditorDiffRequestSnapshot } from '@/state/sql-editor/sql-editor-diff-request'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(
  () => import('./MonacoEditor').then(({ MonacoEditor }) => MonacoEditor),
  { ssr: false }
)
const DiffEditor = dynamic(
  () => import('../../ui/DiffEditor').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

const SQLEditorContent = () => {
  const {
    editorRef,
    monacoRef,
    diffEditorRef,
    scrollTopRef,
    refocusEditor,
    clearPendingRunRefocus,
    markRefocusAfterRun,
    refocusEditorAfterRunIfNeeded,
    getEditorSql: getEditorSqlFromEditor,
    clearHighlights,
    applyErrorHighlight,
  } = useSQLEditorContext()

  const os = detectOS()
  const router = useRouter()
  const { ref } = useParams()

  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const queryClient = useQueryClient()
  const tabs = useTabsStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const diffRequest = useSqlEditorDiffRequestSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const { aiOptInLevel } = useOrgAiOptInLevel()

  // [Ali] Kill switch to hide the SQL Editor Explain tab and its entry points
  const disablePrettyExplain = useFlag('DisablePrettyExplainOnSqlEditor')

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

  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [isDiffEditorMounted, setIsDiffEditorMounted] = useState(false)
  const [potentialIssues, setPotentialIssues] = useState<PotentialIssues>()

  const [showWidget, setShowWidget] = useState(false)
  const [activeUtilityTab, setActiveUtilityTab] = useState<string>('results')

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_FOCUS_EDITOR, refocusEditor, {
    registerInCommandMenu: true,
  })

  const openNewSnippet = useCallback(() => {
    if (!ref) return
    // skip=true bypasses the "load last visited snippet" redirect on /sql/new.
    // Without it, the effect in pages/project/[ref]/sql/[id].tsx bounces back
    // to the previous snippet.
    router.push(`/project/${ref}/sql/new?skip=true`)
  }, [ref, router])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_NEW_SNIPPET, openNewSnippet, {
    registerInCommandMenu: true,
  })

  const { id, urlId, generatedNewSnippetName, isLoading } = useSnippetIdentity()
  const { onMount, editorMountCount } = useEditorMount({ id })

  const limit = sessionSnap.limit

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
  const { generateSqlTitle, setAiTitle } = useSnippetTitleGenerator()
  const track = useTrack()
  const { mutate: execute, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess(data, vars) {
      if (id) {
        sessionSnap.addResult(id, data.result, vars.autoLimit)

        if (!disablePrettyExplain && isExplainQuery(data.result)) {
          sessionSnap.addExplainResult(id, data.result)
          setActiveUtilityTab('explain')
        } else if (activeUtilityTab === 'explain') {
          // If on Explain tab but ran a non-EXPLAIN query, switch to Results tab
          setActiveUtilityTab('results')
        }
      }

      // revalidate lint query
      queryClient.invalidateQueries({ queryKey: lintKeys.lint(ref) })
      refocusEditorAfterRunIfNeeded()
    },
    onError(error: any, vars) {
      if (id) {
        applyErrorHighlight(error, hasSelection)
        sessionSnap.addResultError(id, error, vars.autoLimit)
      }

      refocusEditorAfterRunIfNeeded()
    },
  })

  const { mutate: executeExplain, isPending: isExplainExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) {
        sessionSnap.addExplainResult(id, data.result)
        setActiveUtilityTab('explain')
      }
    },
    onError(error) {
      if (id) {
        sessionSnap.addExplainResultError(id, error)
        setActiveUtilityTab('explain')
      }
    },
  })

  const prettifyQuery = usePrettifyQuery({ id, isDiffOpen })

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_FORMAT, prettifyQuery, {
    registerInCommandMenu: true,
  })

  // Reads the SQL to run from the editor as an UntrustedSqlFragment. The
  // untrusted→safe promotion (acceptUntrustedSql) happens in the small run /
  // explain gesture handlers below — never inside the longer execute* helpers,
  // which by construction only accept already-reviewed SafeSqlFragments.
  const readEditorSql = useCallback((): UntrustedSqlFragment | undefined => {
    const snippet = getSqlEditorV2StateSnapshot().snippets[id]
    return getEditorSqlFromEditor(snippet?.snippet.content?.unchecked_sql)
  }, [getEditorSqlFromEditor, id])

  const executeQuery = useCallback(
    async (sql: SafeSqlFragment, force: boolean = false) => {
      if (isDiffOpen) {
        clearPendingRunRefocus()
        return
      }

      if (editorRef.current === null || isExecuting || project === undefined) {
        clearPendingRunRefocus()
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

      // use the latest state for the title-generation check
      const snippet = getSqlEditorV2StateSnapshot().snippets[id]
      if (
        // Don't auto-generate a title when the org has disabled AI or is a HIPAA project,
        // as that would silently forward the query to the AI provider without consent
        aiOptInLevel !== 'disabled' &&
        snippet?.snippet.name.startsWith(untitledSnippetTitle) &&
        IS_PLATFORM
      ) {
        // Intentionally don't await title gen (lazy)
        setAiTitle(id, sql)
      }

      clearHighlights()

      const impersonatedRoleState = getImpersonatedRoleState()
      const connectionString = databases?.find(
        (db) => db.identifier === databaseSelectorState.selectedDatabaseId
      )?.connectionString
      if (!isValidConnString(connectionString)) {
        clearPendingRunRefocus()
        return toast.error('Unable to run query: Connection string is missing')
      }

      const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
      const formattedSql = suffixWithLimit(sql, limit)

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
      project,
      aiOptInLevel,
      execute,
      getImpersonatedRoleState,
      setAiTitle,
      databaseSelectorState.selectedDatabaseId,
      databases,
      eventTriggers,
      limit,
      track,
    ]
  )

  // Run gesture from the toolbar button: promote here, then run.
  const executeQueryFromButton = useCallback(() => {
    markRefocusAfterRun()
    refocusEditor()
    const sql = readEditorSql()
    if (sql === undefined) return clearPendingRunRefocus()
    void executeQuery(acceptUntrustedSql(sql))
  }, [clearPendingRunRefocus, executeQuery, markRefocusAfterRun, readEditorSql, refocusEditor])

  // Run gesture from the editor (Cmd/Ctrl+Enter): promote here, then run.
  const handleRunShortcut = useCallback(() => {
    const sql = readEditorSql()
    if (sql !== undefined) void executeQuery(acceptUntrustedSql(sql))
  }, [executeQuery, readEditorSql])

  const executeExplainQuery = useCallback(
    async (sql: SafeSqlFragment) => {
      if (isDiffOpen) return

      if (editorRef.current !== null && !isExplainExecuting && project !== undefined) {
        // Check for multiple statements - EXPLAIN only works on a single statement
        const statements = splitSqlStatements(sql)
        if (statements.length > 1) {
          sessionSnap.addExplainResultError(id, {
            message:
              'EXPLAIN only works on a single SQL statement. Please select just one query to analyze.',
          })
          setActiveUtilityTab('explain')
          return
        }

        clearHighlights()

        const impersonatedRoleState = getImpersonatedRoleState()
        const connectionString = databases?.find(
          (db) => db.identifier === databaseSelectorState.selectedDatabaseId
        )?.connectionString
        if (!isValidConnString(connectionString)) {
          return toast.error('Unable to run query: Connection string is missing')
        }

        // Wrap in EXPLAIN ANALYZE (unless already an EXPLAIN), apply role
        // impersonation, and wrap in a rollback transaction so EXPLAIN ANALYZE
        // INSERT/UPDATE/DELETE queries don't actually modify data.
        const explainSqlWithTransaction = buildExplainSql(sql, impersonatedRoleState)

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
    },
    [
      editorRef,
      isDiffOpen,
      id,
      isExplainExecuting,
      project,
      executeExplain,
      getImpersonatedRoleState,
      databaseSelectorState.selectedDatabaseId,
      databases,
      clearHighlights,
      sessionSnap,
    ]
  )

  // Explain gesture (editor action, toolbar, shortcut): promote here, then run.
  const handleRunExplain = useCallback(() => {
    const sql = readEditorSql()
    if (sql !== undefined) void executeExplainQuery(acceptUntrustedSql(sql))
  }, [executeExplainQuery, readEditorSql])

  useShortcut(SHORTCUT_IDS.SQL_EDITOR_EXPLAIN, handleRunExplain, {
    enabled: !disablePrettyExplain,
    registerInCommandMenu: true,
  })

  const handleNewQuery = useCallback(
    async (sql: string, name: string) => {
      if (!ref) return console.error('Project ref is required')
      if (!profile) return console.error('Profile is required')
      if (!project) return console.error('Project is required')

      try {
        const snippet = createSqlSnippetSkeletonV2({
          name,
          sql,
          owner_id: profile.id,
          project_id: project.id,
        })
        snapV2.addSnippet({ projectRef: ref, snippet })
        snapV2.addNeedsSaving(snippet.id!)
        router.push(`/project/${ref}/sql/${snippet.id}`)
      } catch (error: any) {
        toast.error(`Failed to create new query: ${error.message}`)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.id, project?.id, ref, router, snapV2]
  )

  const buildDebugPrompt = useCallback(() => {
    const snippet = snapV2.snippets[id]
    const result = sessionSnap.results[id]?.[0]
    const sql = (snippet?.snippet.content?.unchecked_sql ?? '')
      .replace(sqlAiDisclaimerComment, '')
      .trim()
    const errorMessage = result?.error?.message ?? 'Unknown error'

    return buildDebugPromptText(sql, errorMessage)
  }, [id, sessionSnap.results, snapV2.snippets])

  const onDebug = useCallback(async () => {
    try {
      const snippet = snapV2.snippets[id]
      const result = sessionSnap.results[id]?.[0]
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
  }, [id, sessionSnap.results, snapV2.snippets])

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
        const { title } = await generateSqlTitle({ sql })
        await handleNewQuery(sql, title)
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
  }, [sourceSqlDiff, selectedDiffType, handleNewQuery, generateSqlTitle, router, id, snapV2, track])

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
        const { original, modified } = assembleCompletionDiff(meta, text)

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

  const resetDiff = useEffectEvent(() => {
    if (id) {
      closeDiff()
      setPromptState((prev) => ({ ...prev, isOpen: false }))
    }
  })
  const saveScrollPosition = useEffectEvent((snippetId: string) => {
    if (ref) {
      const tabId = createTabId('sql', { id: snippetId })
      tabs.updateTab(tabId, { scrollTop: scrollTopRef.current })
    }
  })
  useEffect(() => {
    resetDiff()
    return () => saveScrollPosition(id)
    // Temporary until we update eslint to ignore useEffectEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
  }, [
    editorRef,
    os,
    isDiffOpen,
    promptState.isOpen,
    acceptAiHandler,
    discardAiHandler,
    resetPrompt,
  ])

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

  const drainDiffRequest = useEffectEvent(() => {
    const request = diffRequest.pending
    if (request === undefined) return

    const editorModel = editorRef.current?.getModel()
    // Editor isn't ready yet; leave the request pending. editorMountCount bumps
    // on mount and re-runs this effect, so the request applies once mounted.
    if (!editorModel) return

    const { diffType, sql } = request
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

    // One-shot: drain the request so it can't re-apply to a later editor or session.
    diffRequest.consumeDiffRequest()
  })
  useEffect(() => {
    drainDiffRequest()
    // until we can upgrade eslint to ignore useEffectEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffRequest.pending, editorMountCount])

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
  }, [diffEditorRef, isDiffOpen, isDiffEditorMounted])

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
          markRefocusAfterRun()
          setPotentialIssues(undefined)
          refocusEditor()
          // The user has reviewed the warning and confirmed — promote here.
          const sql = readEditorSql()
          if (sql === undefined) return clearPendingRunRefocus()
          void executeQuery(acceptUntrustedSql(sql), true)
        }}
        onConfirmWithRLS={() => {
          const tables = potentialIssues?.createTablesMissingRLS ?? []
          if (tables.length === 0) return
          const baseSql = readEditorSql() ?? untrustedSql('')
          const rewrittenSql = appendEnableRLSStatements(baseSql, tables)
          markRefocusAfterRun()
          setPotentialIssues(undefined)
          refocusEditor()
          // The user has reviewed the warning and confirmed — promote here.
          void executeQuery(acceptUntrustedSql(untrustedSql(rewrittenSql)), true)
        }}
      />

      <div className="flex flex-col h-full">
        <UtilityActions
          id={id}
          isExecuting={isExecuting}
          isDisabled={isDiffOpen}
          hasSelection={hasSelection}
          prettifyQuery={prettifyQuery}
          executeQuery={executeQueryFromButton}
          className="px-4 min-h-[42px] border-b shrink-0"
        />
        <ResizablePanelGroup
          className="relative flex-1 min-h-0"
          orientation="vertical"
          autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
        >
          <ResizablePanel defaultSize="50" maxSize="70">
            <div className="grow overflow-y-auto border-b h-full">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="animate-spin text-brand" />
                </div>
              ) : (
                <>
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
                      snippetName={
                        urlId === 'new'
                          ? generatedNewSnippetName
                          : (snapV2.snippets[id]?.snippet.name ?? generatedNewSnippetName)
                      }
                      className={cn(isDiffOpen && 'hidden')}
                      editorRef={editorRef}
                      monacoRef={monacoRef}
                      executeQuery={handleRunShortcut}
                      executeExplainQuery={handleRunExplain}
                      showExplainAction={!disablePrettyExplain}
                      prettifyQuery={prettifyQuery}
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
                isExecuting={isExecuting}
                isExplainExecuting={isExplainExecuting}
                isDisabled={isDiffOpen}
                executeExplainQuery={handleRunExplain}
                showExplainTab={!disablePrettyExplain}
                onDebug={onDebug}
                buildDebugPrompt={buildDebugPrompt}
                activeTab={activeUtilityTab}
                onActiveTabChange={setActiveUtilityTab}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}

export const SQLEditor = () => (
  <SQLEditorProvider>
    <SQLEditorContent />
  </SQLEditorProvider>
)
