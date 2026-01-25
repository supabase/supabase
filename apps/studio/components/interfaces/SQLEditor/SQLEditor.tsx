import type { Monaco } from '@monaco-editor/react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronUp, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import {
  isExplainQuery,
  isExplainSql,
  splitSqlStatements,
} from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import ResizableAIWidget from 'components/ui/AIEditor/ResizableAIWidget'
import { GridFooter } from 'components/ui/GridFooter'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { constructHeaders, isValidConnString } from 'data/fetchers'
import { lintKeys } from 'data/lint/keys'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { wrapWithRollback } from 'data/sql/utils/transaction'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { isError } from 'data/utils/error-check'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { generateUuid } from 'lib/api/snippets.browser'
import { BASE_PATH } from 'lib/constants'
import { formatSql } from 'lib/formatSql'
import { detectOS } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
} from 'state/role-impersonation-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
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
import { RunQueryWarningModal } from './RunQueryWarningModal'
import {
  generateSnippetTitle,
  ROWS_PER_PAGE_OPTIONS,
  sqlAiDisclaimerComment,
  untitledSnippetTitle,
} from './SQLEditor.constants'
import { DiffType, IStandaloneCodeEditor, IStandaloneDiffEditor } from './SQLEditor.types'
import {
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  createSqlSnippetSkeletonV2,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import { useAddDefinitions } from './useAddDefinitions'
import UtilityPanel from './UtilityPanel/UtilityPanel'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('../../ui/DiffEditor').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

export const SQLEditor = () => {
  const os = detectOS()
  const router = useRouter()
  const { ref, id: urlId } = useParams()

  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const queryClient = useQueryClient()
  const tabs = useTabsStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const { isHipaaProjectDisallowed } = useOrgAiOptInLevel()
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

  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])
  const [isDiffEditorMounted, setIsDiffEditorMounted] = useState(false)
  const [showPotentialIssuesModal, setShowPotentialIssuesModal] = useState(false)
  const [queryHasDestructiveOperations, setQueryHasDestructiveOperations] = useState(false)
  const [queryHasUpdateWithoutWhere, setQueryHasUpdateWithoutWhere] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  const [activeUtilityTab, setActiveUtilityTab] = useState<string>('results')

  // generate a new snippet title and an id to be used for new snippets. The dependency on urlId is to avoid a bug which
  // shows up when clicking on the SQL Editor while being in the SQL editor on a random snippet.
  const [generatedNewSnippetName, generatedId] = useMemo(() => {
    const name = generateSnippetTitle()
    return [name, generateUuid([`${name}.sql`])]
  }, [urlId])

  // the id is stable across renders - it depends either on the url or on the memoized generated id
  const id = !urlId || urlId === 'new' ? generatedId : urlId

  const limit = snapV2.limit
  const results = snapV2.results[id]?.[0]
  const snippetIsLoading = !(
    id in snapV2.snippets && snapV2.snippets[id].snippet.content !== undefined
  )
  const isLoading = urlId === 'new' ? false : snippetIsLoading

  useAddDefinitions(id, monacoRef.current)

  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery(
    {
      projectRef: ref,
    },
    { enabled: isValidConnString(project?.connectionString) }
  )

  /* React query mutations */
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: execute, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess(data, vars) {
      if (id) {
        snapV2.addResult(id, data.result, vars.autoLimit)

        if (showPrettyExplain && isExplainQuery(data.result)) {
          snapV2.addExplainResult(id, data.result)
          setActiveUtilityTab('explain')
        } else if (activeUtilityTab === 'explain') {
          // If on Explain tab but ran a non-EXPLAIN query, switch to Results tab
          setActiveUtilityTab('results')
        }
      }

      // revalidate lint query
      queryClient.invalidateQueries({ queryKey: lintKeys.lint(ref) })
    },
    onError(error: any, vars) {
      if (id) {
        if (error.position && monacoRef.current) {
          const editor = editorRef.current
          const monaco = monacoRef.current

          const startLineNumber = hasSelection ? editor?.getSelection()?.startLineNumber ?? 0 : 0

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

  const setAiTitle = useCallback(
    async (id: string, sql: string) => {
      try {
        const { title: name } = await generateSqlTitle({ sql })
        snapV2.updateSnippet({ id, snippet: { name } })
        snapV2.addNeedsSaving(id)
        const tabId = createTabId('sql', { id })
        tabs.updateTab(tabId, { label: name })
      } catch (error) {
        // [Joshen] No error handler required as this happens in the background and not necessary to ping the user
      }
    },
    [generateSqlTitle, snapV2]
  )

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
        ? (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content?.sql
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

  const executeQuery = useCallback(
    async (force: boolean = false) => {
      if (isDiffOpen) return

      // use the latest state
      const state = getSqlEditorV2StateSnapshot()
      const snippet = state.snippets[id]

      if (editorRef.current !== null && !isExecuting && project !== undefined) {
        const editor = editorRef.current
        const selection = editor.getSelection()
        const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined

        const sql = snippet
          ? (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content?.sql
          : selectedValue || editorRef.current?.getValue()

        let queryHasIssues = false

        const destructiveOperations = checkDestructiveQuery(sql)
        if (!force && destructiveOperations) {
          setShowPotentialIssuesModal(true)
          setQueryHasDestructiveOperations(true)
          queryHasIssues = true
        }

        const updateWithoutWhereClause = isUpdateWithoutWhere(sql)
        if (!force && updateWithoutWhereClause) {
          setShowPotentialIssuesModal(true)
          setQueryHasUpdateWithoutWhere(true)
          queryHasIssues = true
        }

        if (queryHasIssues) {
          return
        }

        if (
          !isHipaaProjectDisallowed &&
          snippet?.snippet.name.startsWith(untitledSnippetTitle) &&
          IS_PLATFORM
        ) {
          // Intentionally don't await title gen (lazy)
          setAiTitle(id, sql)
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

        sendEvent({
          action: 'sql_editor_query_run_button_clicked',
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isDiffOpen,
      id,
      isExecuting,
      project,
      isHipaaProjectDisallowed,
      execute,
      getImpersonatedRoleState,
      setAiTitle,
      databaseSelectorState.selectedDatabaseId,
      databases,
      limit,
    ]
  )

  const executeExplainQuery = useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]

    if (editorRef.current !== null && !isExplainExecuting && project !== undefined) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined

      const sql = snippet
        ? (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content?.sql
        : selectedValue || editorRef.current?.getValue()

      // Check for multiple statements - EXPLAIN only works on a single statement
      const statements = splitSqlStatements(sql)
      if (statements.length > 1) {
        snapV2.addExplainResultError(id, {
          message:
            'EXPLAIN only works on a single SQL statement. Please select just one query to analyze.',
        })
        setActiveUtilityTab('explain')
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
      const explainSql = isExplainSql(sql) ? sql : `EXPLAIN ANALYZE ${sql}`

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

  const onDebug = useCallback(async () => {
    try {
      const snippet = snapV2.snippets[id]
      const result = snapV2.results[id]?.[0]
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat({
        name: 'Debug SQL snippet',
        sqlSnippets: [
          (snippet.snippet.content?.sql ?? '').replace(sqlAiDisclaimerComment, '').trim(),
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

      sendEvent({
        action: 'assistant_sql_diff_handler_evaluated',
        properties: { handlerAccepted: true },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      setSelectedDiffType(DiffType.Modification)
      resetPrompt()
      closeDiff()
    } finally {
      setIsAcceptDiffLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSqlDiff, selectedDiffType, handleNewQuery, generateSqlTitle, router, id, snapV2])

  const discardAiHandler = useCallback(() => {
    sendEvent({
      action: 'assistant_sql_diff_handler_evaluated',
      properties: { handlerAccepted: false },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    resetPrompt()
    closeDiff()
  }, [closeDiff, resetPrompt, sendEvent])

  const [isCompletionLoading, setIsCompletionLoading] = useState<boolean>(false)

  const complete = useCallback(
    async (
      prompt: string,
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
        visible={showPotentialIssuesModal}
        hasDestructiveOperations={queryHasDestructiveOperations}
        hasUpdateWithoutWhere={queryHasUpdateWithoutWhere}
        onCancel={() => {
          setShowPotentialIssuesModal(false)
          setQueryHasDestructiveOperations(false)
          setQueryHasUpdateWithoutWhere(false)
          setTimeout(() => editorRef.current?.focus(), 100)
        }}
        onConfirm={() => {
          setShowPotentialIssuesModal(false)
          executeQuery(true)
        }}
      />

      <div className="flex h-full">
        <ResizablePanelGroup
          className="relative"
          direction="vertical"
          autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
        >
          <ResizablePanel defaultSize={50} maxSize={70}>
            <div className="flex-grow overflow-y-auto border-b h-full">
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
                            (os === 'macos' ? 'CMD+K' : `CTRL+K`) +
                            ' to generate query or just start typing'
                          : ''
                      }
                      id={id}
                      snippetName={
                        urlId === 'new'
                          ? generatedNewSnippetName
                          : snapV2.snippets[id]?.snippet.name ?? generatedNewSnippetName
                      }
                      className={cn(isDiffOpen && 'hidden')}
                      editorRef={editorRef}
                      monacoRef={monacoRef}
                      executeQuery={executeQuery}
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

          <ResizablePanel defaultSize={50} maxSize={70}>
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
                hasSelection={hasSelection}
                prettifyQuery={prettifyQuery}
                executeQuery={executeQuery}
                executeExplainQuery={executeExplainQuery}
                onDebug={onDebug}
                activeTab={activeUtilityTab}
                onActiveTabChange={setActiveUtilityTab}
              />
            )}
          </ResizablePanel>

          <div className="h-9">
            {results?.rows !== undefined && !isExecuting && (
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
                          <DropdownMenuRadioItem key={option.label} value={option.value.toString()}>
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
