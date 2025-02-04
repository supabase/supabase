import type { Monaco } from '@monaco-editor/react'
import { useQueryClient } from '@tanstack/react-query'
import { useCompletion } from 'ai/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, Command, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { TelemetryActions } from 'common/telemetry-constants'
import { GridFooter } from 'components/ui/GridFooter'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { constructHeaders } from 'data/fetchers'
import { lintKeys } from 'data/lint/keys'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { isError } from 'data/utils/error-check'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { formatSql } from 'lib/formatSql'
import { detectOS, uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { useAppStateSnapshot } from 'state/app-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { isRoleImpersonationEnabled, useGetImpersonatedRole } from 'state/role-impersonation-state'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
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
  cn,
} from 'ui'
import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import { AskAIWidget } from './AskAIWidget'
import { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import InlineWidget from './InlineWidget'
import { RunQueryWarningModal } from './RunQueryWarningModal'
import {
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
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

export const SQLEditor = () => {
  const os = detectOS()
  const router = useRouter()
  const { ref, id: urlId } = useParams()
  const org = useSelectedOrganization()
  const { profile } = useProfile()
  const queryClient = useQueryClient()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()
  const appSnap = useAppStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const getImpersonatedRole = useGetImpersonatedRole()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const isOptedInToAI = useOrgOptedIntoAi()
  const [selectedSchemas] = useSchemasForAi(project?.ref!)
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const {
    sourceSqlDiff,
    setSourceSqlDiff,
    selectedDiffType,
    setSelectedDiffType,
    pendingTitle,
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
  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])
  const [isDiffEditorMounted, setIsDiffEditorMounted] = useState(false)
  const [showPotentialIssuesModal, setShowPotentialIssuesModal] = useState(false)
  const [queryHasDestructiveOperations, setQueryHasDestructiveOperations] = useState(false)
  const [queryHasUpdateWithoutWhere, setQueryHasUpdateWithoutWhere] = useState(false)
  const [showWidget, setShowWidget] = useState(false)

  // generate an id to be used for new snippets. The dependency on urlId is to avoid a bug which
  // shows up when clicking on the SQL Editor while being in the SQL editor on a random snippet.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedId = useMemo(() => uuidv4(), [urlId])
  // the id is stable across renders - it depends either on the url or on the memoized generated id
  const id = !urlId || urlId === 'new' ? generatedId : urlId

  const limit = snapV2.limit
  const results = snapV2.results[id]?.[0]
  const snippetIsLoading = !(
    id in snapV2.snippets && snapV2.snippets[id].snippet.content !== undefined
  )
  const isLoading = urlId === 'new' ? false : snippetIsLoading

  useAddDefinitions(id, monacoRef.current)

  /** React query data fetching  */
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery({
    projectRef: ref,
  })

  const { data, refetch: refetchEntityDefinitions } = useEntityDefinitionsQuery(
    {
      schemas: selectedSchemas,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )
  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined

  /* React query mutations */
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess(data, vars) {
      if (id) snapV2.addResult(id, data.result, vars.autoLimit)

      // Refetching instead of invalidating since invalidate doesn't work with `enabled` flag
      refetchEntityDefinitions()

      // revalidate lint query
      queryClient.invalidateQueries(lintKeys.lint(ref))
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

  const setAiTitle = useCallback(
    async (id: string, sql: string) => {
      try {
        const { title: name } = await generateSqlTitle({ sql })
        snapV2.renameSnippet({ id, name })
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
        snapV2.setSql(id, formattedSql)
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

        if (!hasHipaaAddon && snippet?.snippet.name === untitledSnippetTitle) {
          // Intentionally don't await title gen (lazy)
          setAiTitle(id, sql)
        }

        if (lineHighlights.length > 0) {
          editor?.deltaDecorations(lineHighlights, [])
          setLineHighlights([])
        }

        const impersonatedRole = getImpersonatedRole()
        const connectionString = databases?.find(
          (db) => db.identifier === databaseSelectorState.selectedDatabaseId
        )?.connectionString
        if (IS_PLATFORM && !connectionString) {
          return toast.error('Unable to run query: Connection string is missing')
        }

        const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
        const formattedSql = suffixWithLimit(sql, limit)

        execute({
          projectRef: project.ref,
          connectionString: connectionString,
          sql: wrapWithRoleImpersonation(formattedSql, {
            projectRef: project.ref,
            role: impersonatedRole,
          }),
          autoLimit: appendAutoLimit ? limit : undefined,
          isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRole),
          contextualInvalidation: true,
          handleError: (error) => {
            throw error
          },
        })

        sendEvent({
          action: TelemetryActions.SQL_EDITOR_QUERY_RUN_BUTTON_CLICKED,
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
      hasHipaaAddon,
      execute,
      getImpersonatedRole,
      setAiTitle,
      databaseSelectorState.selectedDatabaseId,
      databases,
      limit,
    ]
  )

  const handleNewQuery = useCallback(
    async (sql: string, name: string) => {
      if (!ref) return console.error('Project ref is required')
      if (!profile) return console.error('Profile is required')
      if (!project) return console.error('Project is required')

      try {
        const snippet = createSqlSnippetSkeletonV2({
          id: uuidv4(),
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

  const onDebug = useCallback(async () => {
    try {
      const snippet = snapV2.snippets[id]
      const result = snapV2.results[id]?.[0]
      appSnap.setAiAssistantPanel({
        open: true,
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
  }, [entityDefinitions, id, snapV2.results, snapV2.snippets])

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

        if (pendingTitle) {
          snapV2.renameSnippet({ id, name: pendingTitle })
        }
      }

      sendEvent({
        action: TelemetryActions.ASSISTANT_SQL_DIFF_HANDLER_EVALUATED,
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
  }, [
    sourceSqlDiff,
    selectedDiffType,
    handleNewQuery,
    generateSqlTitle,
    router,
    id,
    pendingTitle,
    snapV2,
  ])

  const discardAiHandler = useCallback(() => {
    sendEvent({
      action: TelemetryActions.ASSISTANT_SQL_DIFF_HANDLER_EVALUATED,
      properties: { handlerAccepted: false },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    resetPrompt()
    closeDiff()
  }, [closeDiff, resetPrompt, sendEvent])

  const {
    complete,
    completion,
    isLoading: isCompletionLoading,
  } = useCompletion({
    api: `${BASE_PATH}/api/ai/sql/complete`,
    body: {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      includeSchemaMetadata,
    },
    onResponse: (response) => {
      if (!response.ok) throw new Error('Failed to generate completion')
    },
    onError: (error) => {
      toast.error(`Failed to generate SQL: ${error.message}`)
    },
  })

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

      await complete(prompt, {
        headers: { Authorization: headerData.get('Authorization') ?? '' },
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

  useEffect(() => {
    if (!completion) {
      return
    }

    const original =
      promptState.beforeSelection + promptState.selection + promptState.afterSelection
    const modified = promptState.beforeSelection + completion + promptState.afterSelection

    if (isCompletionLoading) {
      // Attempt to format the modified SQL in case the LLM left out indentation, etc
      let formattedModified = formatSql(modified)

      setSourceSqlDiff({
        original,
        modified: formattedModified,
      })
      setSelectedDiffType(DiffType.Modification)
      setPromptState((prev) => ({ ...prev, isLoading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    completion,
    promptState.beforeSelection,
    promptState.selection,
    promptState.afterSelection,
    isCompletionLoading,
  ])

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

      <ResizablePanelGroup
        className="flex h-full"
        direction="horizontal"
        autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_PANEL_SPLIT_SIZE}
      >
        <ResizablePanel minSize={30}>
          <ResizablePanelGroup
            className="relative"
            direction="vertical"
            autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
          >
            <ResizablePanel maxSize={70}>
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
                          theme="supabase"
                          language="pgsql"
                          original={defaultSqlDiff.original}
                          modified={defaultSqlDiff.modified}
                          onMount={(editor) => {
                            diffEditorRef.current = editor
                            setIsDiffEditorMounted(true)
                          }}
                          options={{
                            fontSize: 13,
                            renderSideBySide: false,
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            folding: false,
                            padding: { top: 4 },
                            lineNumbersMinChars: 3,
                          }}
                        />
                        {showWidget && (
                          <InlineWidget
                            editor={diffEditorRef.current!}
                            id="ask-ai-diff"
                            heightInLines={3}
                            afterLineNumber={0}
                            beforeLineNumber={Math.max(0, promptState.startLineNumber - 1)}
                          >
                            <AskAIWidget
                              onSubmit={(prompt: string) => {
                                handlePrompt(prompt, {
                                  beforeSelection: promptState.beforeSelection,
                                  selection: promptState.selection || defaultSqlDiff.modified,
                                  afterSelection: promptState.afterSelection,
                                })
                              }}
                              value={promptInput}
                              onChange={setPromptInput}
                              onAccept={acceptAiHandler}
                              onReject={discardAiHandler}
                              isDiffVisible={true}
                              isLoading={isCompletionLoading}
                            />
                          </InlineWidget>
                        )}
                      </div>
                    )}
                    <div key={id} className="w-full h-full relative">
                      <MonacoEditor
                        autoFocus
                        id={id}
                        className={cn(isDiffOpen && 'hidden')}
                        editorRef={editorRef}
                        monacoRef={monacoRef}
                        executeQuery={executeQuery}
                        onHasSelection={setHasSelection}
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
                        <InlineWidget
                          editor={editorRef.current}
                          id="ask-ai"
                          afterLineNumber={promptState.endLineNumber}
                          beforeLineNumber={Math.max(0, promptState.startLineNumber - 1)}
                          heightInLines={2}
                        >
                          <AskAIWidget
                            value={promptInput}
                            onChange={setPromptInput}
                            onSubmit={(prompt: string) => {
                              handlePrompt(prompt, {
                                beforeSelection: promptState.beforeSelection,
                                selection: promptState.selection,
                                afterSelection: promptState.afterSelection,
                              })
                            }}
                            isDiffVisible={false}
                            isLoading={isCompletionLoading}
                          />
                        </InlineWidget>
                      )}
                      <AnimatePresence>
                        {!promptState.isOpen && !editorRef.current?.getValue() && (
                          <motion.p
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 5, opacity: 0 }}
                            className="text-foreground-lighter absolute bottom-4 left-4 z-10 font-mono text-xs flex items-center gap-1"
                          >
                            Hit {os === 'macos' ? <Command size={12} /> : `CTRL+`}K to edit with the
                            Assistant
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel maxSize={70}>
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="animate-spin text-brand" />
                </div>
              ) : (
                <UtilityPanel
                  id={id}
                  isExecuting={isExecuting}
                  isDisabled={isDiffOpen}
                  hasSelection={hasSelection}
                  prettifyQuery={prettifyQuery}
                  executeQuery={executeQuery}
                  onDebug={onDebug}
                />
              )}
            </ResizablePanel>

            <ResizablePanel maxSize={10} minSize={10} className="max-h-9">
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  )
}
