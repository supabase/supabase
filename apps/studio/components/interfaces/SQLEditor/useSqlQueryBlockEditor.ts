import type { Monaco } from '@monaco-editor/react'
import { rawSql, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { wrapWithRollback } from '@supabase/pg-meta/src/query'
import { useQueryClient } from '@tanstack/react-query'
import { IS_PLATFORM, useParams } from 'common'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { sqlAiDisclaimerComment, untitledSnippetTitle } from './SQLEditor.constants'
import type { IStandaloneCodeEditor, PotentialIssues } from './SQLEditor.types'
import {
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  hasActiveEnsureRLSTrigger,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import { getSnippetSqlFromContent } from './sqlSnippet.utils'
import {
  isExplainQuery,
  isExplainSql,
  splitSqlStatements,
} from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { getNotebookBlockUtilityTab } from '@/components/interfaces/Notebook/notebookBlock.utils'
import {
  checkForILIKEClause,
  checkForWithClause,
} from '@/components/interfaces/Settings/Logs/Logs.utils'
import { buildLogQueryParams } from '@/components/interfaces/Settings/Logs/logsDateRange'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSqlTitleGenerateMutation } from '@/data/ai/sql-title-mutation'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
import { isValidConnString } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import { useExecuteLogsSqlMutation } from '@/data/logs/execute-logs-sql-mutation'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { registerNotebookBlock, unregisterNotebookBlockRun } from '@/state/notebook-block-registry'
import { useNotebookEditorContext } from '@/state/notebook-editor-context'
import { useQueryExecutionSourceSnapshot } from '@/state/query-execution-source'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
} from '@/state/role-impersonation-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export interface UseSqlQueryBlockEditorOptions {
  id: string
  editorRef: React.MutableRefObject<IStandaloneCodeEditor | null>
  monacoRef: React.MutableRefObject<Monaco | null>
}

export function useSqlQueryBlockEditor({
  id,
  editorRef,
  monacoRef,
}: UseSqlQueryBlockEditorOptions) {
  const { ref } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const queryClient = useQueryClient()
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const queryExecutionSourceState = useQueryExecutionSourceSnapshot()
  const { isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const notebookEditorContext = useNotebookEditorContext()

  const [hasSelection, setHasSelection] = useState(false)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])
  const [potentialIssues, setPotentialIssues] = useState<PotentialIssues>()
  const [activeUtilityTab, setActiveUtilityTab] = useState(() =>
    notebookEditorContext
      ? getNotebookBlockUtilityTab(notebookEditorContext.chartConfig)
      : 'results'
  )

  useEffect(() => {
    if (!notebookEditorContext) return
    setActiveUtilityTab(getNotebookBlockUtilityTab(notebookEditorContext.chartConfig))
  }, [
    notebookEditorContext?.blockId,
    notebookEditorContext?.chartConfig.view,
    notebookEditorContext?.chartConfig.xKey,
    notebookEditorContext?.chartConfig.yKey,
  ])

  const shouldRefocusAfterRunRef = useRef(false)
  const limit = snapV2.limit
  const results = snapV2.results[id]?.[0]

  const refocusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => editorRef.current?.focus(), 0)
    })
  }, [editorRef])

  const clearPendingRunRefocus = useCallback(() => {
    shouldRefocusAfterRunRef.current = false
  }, [])

  const refocusEditorAfterRunIfNeeded = useCallback(() => {
    if (!shouldRefocusAfterRunRef.current) return
    shouldRefocusAfterRunRef.current = false
    refocusEditor()
  }, [refocusEditor])

  const { data: databases } = useReadReplicasQuery(
    { projectRef: ref },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const { data: eventTriggers } = useDatabaseEventTriggersQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const { mutateAsync: executeAsync, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess(data, vars) {
      if (id) {
        snapV2.addResult(id, data.result, vars.autoLimit)
        if (activeUtilityTab === 'explain' && !isExplainQuery(data.result)) {
          setActiveUtilityTab('results')
        } else if (
          notebookEditorContext &&
          getNotebookBlockUtilityTab(notebookEditorContext.chartConfig) === 'chart'
        ) {
          setActiveUtilityTab('chart')
        }
      }
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
                  options: { isWholeLine: true, inlineClassName: 'bg-warning-400' },
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

  const { mutate: executeExplain, isPending: isExplainExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) {
        snapV2.addExplainResult(id, data.result)
        setActiveUtilityTab('explain')
      }
    },
    onError(error) {
      if (id) {
        snapV2.addExplainResultError(id, error)
        setActiveUtilityTab('explain')
      }
    },
  })

  const { mutateAsync: executeLogsAsync, isPending: isLogsExecuting } = useExecuteLogsSqlMutation({
    onSuccess(data) {
      if (id) {
        const rows = data?.result ?? []
        if (data?.error) {
          snapV2.addLogsResultError(id, data.error)
        } else {
          snapV2.addLogsResult(id, rows)
        }
        setActiveUtilityTab('results')
      }
      refocusEditorAfterRunIfNeeded()
    },
    onError(error) {
      if (id) {
        snapV2.addLogsResultError(id, error)
      }
      refocusEditorAfterRunIfNeeded()
    },
  })

  const setAiTitle = useCallback(
    async (snippetId: string, sql: string) => {
      try {
        const { title: name } = await generateSqlTitle({ sql })
        snapV2.updateSnippet({ id: snippetId, snippet: { name } })
        snapV2.addNeedsSaving(snippetId)
      } catch {
        // background title generation — no user feedback needed
      }
    },
    [generateSqlTitle, snapV2]
  )

  const prettifyQuery = useCallback(async () => {
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

      const editorModel = editorRef.current?.getModel()
      if (editorRef.current && editorModel) {
        editorRef.current.executeEdits('apply-prettify-edit', [
          { text: formattedSql, range: editorModel.getFullModelRange() },
        ])
        snapV2.setSql({ id, sql: formattedSql })
      }
    }
  }, [id, project, snapV2, editorRef])

  const getEditorSql = useCallback(() => {
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]
    const editor = editorRef.current
    const snippetSql = getSnippetSqlFromContent(snippet?.snippet.content)
    const selection = editor?.getSelection()
    const selectedValue = selection ? editor?.getModel()?.getValueInRange(selection) : undefined

    if (snippet) {
      return (selectedValue || editor?.getValue()) ?? snippetSql
    }

    return selectedValue || editor?.getValue() || snippetSql
  }, [id, editorRef])

  const executeQuery = useCallback(
    async (force: boolean = false, sqlOverride?: SafeSqlFragment) => {
      const state = getSqlEditorV2StateSnapshot()
      const snippet = state.snippets[id]
      const editor = editorRef.current
      const snippetSql = getSnippetSqlFromContent(snippet?.snippet.content)

      if ((!editor && !snippetSql) || isExecuting || isLogsExecuting || project === undefined) {
        clearPendingRunRefocus()
        return
      }

      const sql = String(sqlOverride ?? getEditorSql() ?? '')

      const executionSource =
        notebookEditorContext?.querySource ?? queryExecutionSourceState.executionSource

      if (executionSource === 'logs') {
        if (!sql || sql.trim().length === 0) {
          clearPendingRunRefocus()
          return toast.error('Please enter a query to run')
        }

        const usesWith = checkForWithClause(sql)
        const usesILIKE = checkForILIKEClause(sql)
        if (IS_PLATFORM) {
          if (usesWith) {
            clearPendingRunRefocus()
            return toast.error('The parser does not yet support WITH and subquery statements.')
          }
          if (usesILIKE) {
            clearPendingRunRefocus()
            return toast.error('BigQuery does not support ILIKE. Use REGEXP_CONTAINS instead.')
          }
        }

        const resolvedParams = buildLogQueryParams(
          notebookEditorContext?.logsDatePickerValue ??
            queryExecutionSourceState.logsDatePickerValue,
          sql
        )

        await executeLogsAsync({
          projectRef: project.ref,
          sql: resolvedParams.sql,
          iso_timestamp_start: resolvedParams.from,
          iso_timestamp_end: resolvedParams.to,
          useOtel: queryExecutionSourceState.useOtelEndpoint,
        })
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

      if (
        !isHipaaProjectDisallowed &&
        snippet?.snippet.name.startsWith(untitledSnippetTitle) &&
        IS_PLATFORM
      ) {
        setAiTitle(id, sql)
      }

      if (lineHighlights.length > 0 && editor) {
        editor.deltaDecorations(lineHighlights, [])
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

      const userSql = rawSql(sql ?? '')
      const { appendAutoLimit } = checkIfAppendLimitRequired(userSql, limit)
      const formattedSql = suffixWithLimit(userSql, limit)

      await executeAsync({
        projectRef: project.ref,
        connectionString,
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
    [
      clearPendingRunRefocus,
      id,
      isExecuting,
      isLogsExecuting,
      project,
      isHipaaProjectDisallowed,
      executeAsync,
      executeLogsAsync,
      getImpersonatedRoleState,
      setAiTitle,
      databaseSelectorState.selectedDatabaseId,
      databases,
      eventTriggers,
      limit,
      track,
      lineHighlights,
      queryExecutionSourceState,
      notebookEditorContext,
      editorRef,
      getEditorSql,
    ]
  )

  useEffect(() => {
    if (!notebookEditorContext) return

    const { blockId } = notebookEditorContext

    registerNotebookBlock(blockId, {
      runQuery: async (options) => {
        await executeQuery(options?.force ?? false)
      },
    })

    return () => unregisterNotebookBlockRun(blockId)
  }, [notebookEditorContext, executeQuery])

  const executeQueryFromButton = useCallback(() => {
    if (editorRef.current) {
      shouldRefocusAfterRunRef.current = true
      refocusEditor()
    }
    void executeQuery()
  }, [executeQuery, refocusEditor, editorRef])

  const executeExplainQuery = useCallback(async () => {
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]
    const editor = editorRef.current
    const snippetSql = getSnippetSqlFromContent(snippet?.snippet.content)

    if ((editor || snippetSql) && !isExplainExecuting && project !== undefined) {
      const sql = getEditorSql() ?? ''

      const statements = splitSqlStatements(sql ?? '')
      if (statements.length > 1) {
        snapV2.addExplainResultError(id, {
          message:
            'EXPLAIN only works on a single SQL statement. Please select just one query to analyze.',
        })
        setActiveUtilityTab('explain')
        return
      }

      if (lineHighlights.length > 0 && editor) {
        editor.deltaDecorations(lineHighlights, [])
        setLineHighlights([])
      }

      const impersonatedRoleState = getImpersonatedRoleState()
      const connectionString = databases?.find(
        (db) => db.identifier === databaseSelectorState.selectedDatabaseId
      )?.connectionString
      if (!isValidConnString(connectionString)) {
        return toast.error('Unable to run query: Connection string is missing')
      }

      const userSql = rawSql(sql ?? '')
      const explainSql = isExplainSql(sql) ? userSql : safeSql`EXPLAIN ANALYZE ${userSql}`
      const explainSqlWithTransaction = wrapWithRollback(
        wrapWithRoleImpersonation(explainSql, impersonatedRoleState)
      )

      executeExplain({
        projectRef: project.ref,
        connectionString,
        sql: explainSqlWithTransaction,
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
        handleError: (error) => {
          throw error
        },
      })
    }
  }, [
    id,
    isExplainExecuting,
    project,
    executeExplain,
    getImpersonatedRoleState,
    databaseSelectorState.selectedDatabaseId,
    databases,
    lineHighlights,
    snapV2,
    editorRef,
    getEditorSql,
  ])

  const buildDebugPrompt = useCallback(() => {
    const snippet = snapV2.snippets[id]
    const result = snapV2.results[id]?.[0]
    const sql = (snippet?.snippet.content?.unchecked_sql ?? '')
      .replace(sqlAiDisclaimerComment, '')
      .trim()
    const errorMessage = result?.error?.message ?? 'Unknown error'
    return `Help me to debug the attached sql snippet which gives the following error: \n\n${errorMessage}\n\nSQL Query:\n\`\`\`sql\n${sql}\n\`\`\``
  }, [id, snapV2.results, snapV2.snippets])

  const onDebug = useCallback(async () => {
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
  }, [id, snapV2.results, snapV2.snippets, openSidebar, aiSnap])

  return {
    hasSelection,
    setHasSelection,
    potentialIssues,
    setPotentialIssues,
    activeUtilityTab,
    setActiveUtilityTab,
    results,
    isExecuting,
    isExplainExecuting,
    isLogsExecuting,
    prettifyQuery,
    executeQuery,
    executeQueryFromButton,
    executeExplainQuery,
    buildDebugPrompt,
    onDebug,
    limit,
  }
}
