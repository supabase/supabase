import type { Monaco } from '@monaco-editor/react'
import { useChat } from 'ai/react'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'sql-formatter'

import { useParams, useTelemetryProps } from 'common'
import { useSqlEditMutation } from 'data/ai/sql-edit-mutation'
import { useSqlGenerateMutation } from 'data/ai/sql-generate-mutation'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useFormatQueryMutation } from 'data/sql/format-sql-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { isError } from 'data/utils/error-check'
import { useFlag, useLocalStorageQuery, useSelectedOrganization, useSelectedProject } from 'hooks'
import { BASE_PATH, IS_PLATFORM, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { wrapWithRoleImpersonation } from 'lib/role-impersonation'
import Telemetry from 'lib/telemetry'
import { useAppStateSnapshot } from 'state/app-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { isRoleImpersonationEnabled, useGetImpersonatedRole } from 'state/role-impersonation-state'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  AiIconAnimation,
  IconCornerDownLeft,
  IconSettings,
  IconX,
  Input_Shadcn_,
  Loading,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  cn,
} from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { useIsSQLEditorAiAssistantEnabled } from '../App/FeaturePreview/FeaturePreviewContext'
import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import AISchemaSuggestionPopover from './AISchemaSuggestionPopover'
import { AiAssistantPanel } from './AiAssistantPanel'
import { DiffActionBar } from './DiffActionBar'
import { sqlAiDisclaimerComment, untitledSnippetTitle } from './SQLEditor.constants'
import {
  ContentDiff,
  DiffType,
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
  SQLEditorContextValues,
} from './SQLEditor.types'
import {
  checkDestructiveQuery,
  compareAsAddition,
  compareAsModification,
  compareAsNewSnippet,
  createSqlSnippetSkeleton,
} from './SQLEditor.utils'
import UtilityPanel from './UtilityPanel/UtilityPanel'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

const SQLEditorContext = createContext<SQLEditorContextValues | undefined>(undefined)

export function useSqlEditor() {
  const values = useContext(SQLEditorContext)

  if (!values) {
    throw new Error('No SQL editor context. Are you using useSqlEditor() outside of SQLEditor?')
  }

  return values
}

const SQLEditor = () => {
  const { ref, id: urlId } = useParams()
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  // generate an id to be used for new snippets. The dependency on urlId is to avoid a bug which
  // shows up when clicking on the SQL Editor while being in the SQL editor on a random snippet.
  const generatedId = useMemo(() => uuidv4(), [urlId])
  // the id is stable across renders - it depends either on the url or on the memoized generated id
  const id = !urlId || urlId === 'new' ? generatedId : urlId

  const { profile } = useProfile()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()
  const appSnap = useAppStateSnapshot()
  const snap = useSqlEditorStateSnapshot()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()

  const aiAssistantFlag = useFlag('sqlEditorConversationalAi')
  const aiAssistantFeaturePreview = useIsSQLEditorAiAssistantEnabled()
  const isAiAssistantOn = aiAssistantFlag && aiAssistantFeaturePreview

  const { mutate: formatQuery } = useFormatQueryMutation()
  const { mutateAsync: generateSql, isLoading: isGenerateSqlLoading } = useSqlGenerateMutation()
  const { mutateAsync: editSql, isLoading: isEditSqlLoading } = useSqlEditMutation()
  const { mutateAsync: titleSql } = useSqlTitleGenerateMutation()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()

  const [aiInput, setAiInput] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<string>()
  const [debugSolution, setDebugSolution] = useState<string>()
  const [sourceSqlDiff, setSourceSqlDiff] = useState<ContentDiff>()
  const [pendingTitle, setPendingTitle] = useState<string>()
  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const showReadReplicasUI = project?.is_read_replicas_enabled

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery({
    projectRef: ref,
  })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const [isAiOpen, setIsAiOpen] = useLocalStorageQuery('supabase_sql-editor-ai-open', true)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA, true)
  const [isAcceptDiffLoading, setIsAcceptDiffLoading] = useState(false)
  const [, setAiQueryCount] = useLocalStorageQuery('supabase_sql-editor-ai-query-count', 0)
  const [, setIsSchemaSuggestionDismissed] = useLocalStorageQuery(
    'supabase_sql-editor-ai-schema-suggestion-dismissed',
    false
  )

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  const [selectedDiffType, setSelectedDiffType] = useState<DiffType | undefined>(undefined)
  const [isFirstRender, setIsFirstRender] = useState(true)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])

  const isAiLoading = isGenerateSqlLoading || isEditSqlLoading

  // Used for cleaner framer motion transitions
  useEffect(() => {
    setIsFirstRender(false)
  }, [])

  useEffect(() => {
    if (isSuccessReadReplicas) {
      const primaryDatabase = databases.find((db) => db.identifier === ref)
      databaseSelectorState.setSelectedDatabaseId(primaryDatabase?.identifier)
    }
  }, [isSuccessReadReplicas, databases, ref])

  const { data, refetch: refetchEntityDefinitions } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined

  const isDiffOpen = !!sourceSqlDiff

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)

  const {
    messages: chatMessages,
    append,
    isLoading: isLoadingChat,
  } = useChat({
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    body: {
      existingSql: editorRef.current?.getValue(),
      entityDefinitions: isOptedInToAI ? entityDefinitions : undefined,
    },
  })

  const messages = useMemo(() => {
    const merged = [...chatMessages.map((m) => ({ ...m, isDebug: false }))]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages])

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) snap.addResult(id, data.result)

      // Refetching instead of invalidating since invalidate doesn't work with `enabled` flag
      refetchEntityDefinitions()
    },
    onError(error: any) {
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

        snap.addResultError(id, error)
      }
    },
  })

  const snippet = id ? snap.snippets[id] : null

  const isLoading = urlId === 'new' ? false : !(id && ref && snap.loaded[ref])

  /**
   * Sets the snippet title using AI.
   */
  const setAiTitle = useCallback(
    async (id: string, sql: string) => {
      const { title } = await generateSqlTitle({ sql })

      snap.renameSnippet(id, title)
    },
    [generateSqlTitle, snap]
  )

  const prettifyQuery = useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = getSqlEditorStateSnapshot()
    const snippet = state.snippets[id]

    if (editorRef.current && project) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined
      const sql = snippet
        ? (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content.sql
        : selectedValue || editorRef.current?.getValue()
      formatQuery(
        {
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql,
        },
        {
          onSuccess: (res) => {
            const editorModel = editorRef?.current?.getModel()
            if (editorRef.current && editorModel) {
              editorRef.current.executeEdits('apply-prettify-edit', [
                {
                  text: res.result,
                  range: editorModel.getFullModelRange(),
                },
              ])
              snap.setSql(id, res.result)
            }
          },
        }
      )
    }
  }, [formatQuery, id, isDiffOpen, project, snap])

  const getImpersonatedRole = useGetImpersonatedRole()

  const executeQuery = useCallback(
    async (force: boolean = false) => {
      if (isDiffOpen) return

      // use the latest state
      const state = getSqlEditorStateSnapshot()
      const snippet = state.snippets[id]

      if (editorRef.current !== null && !isExecuting && project !== undefined) {
        const editor = editorRef.current
        const selection = editor.getSelection()
        const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined

        const sql = snippet
          ? (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content.sql
          : selectedValue || editorRef.current?.getValue()

        const containsDestructiveOperations = checkDestructiveQuery(sql)

        if (!force && containsDestructiveOperations) {
          setIsConfirmModalOpen(true)
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
        const connectionString = !showReadReplicasUI
          ? project.connectionString
          : databases?.find((db) => db.identifier === databaseSelectorState.selectedDatabaseId)
              ?.connectionString
        if (IS_PLATFORM && !connectionString) {
          return toast.error('Unable to run query: Connection string is missing')
        }

        execute({
          projectRef: project.ref,
          connectionString: connectionString,
          sql: wrapWithRoleImpersonation(sql, {
            projectRef: project.ref,
            role: impersonatedRole,
          }),
          isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRole),
          handleError: (error) => {
            throw error
          },
        })
      }
    },
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
    ]
  )

  const handleNewQuery = useCallback(
    async (sql: string, name: string) => {
      if (!ref) return console.error('Project ref is required')

      try {
        const snippet = createSqlSnippetSkeleton({
          id: uuidv4(),
          name,
          sql,
          owner_id: profile?.id,
          project_id: project?.id,
        })
        snap.addSnippet(snippet as SqlSnippet, ref)
        snap.addNeedsSaving(snippet.id!)
        router.push(`/project/${ref}/sql/${snippet.id}`)
      } catch (error: any) {
        toast.error(`Failed to create new query: ${error.message}`)
      }
    },
    [profile?.id, project?.id, ref, router, snap]
  )

  const updateEditorWithCheckForDiff = ({
    id,
    diffType,
    sql,
  }: {
    id: string
    diffType: DiffType
    sql: string
  }) => {
    const editorModel = editorRef.current?.getModel()
    if (!editorModel) return

    setAiQueryCount((count) => count + 1)

    const existingValue = editorRef.current?.getValue() ?? ''
    if (existingValue.length === 0) {
      editorRef.current?.executeEdits('apply-ai-message', [
        {
          text: `${sqlAiDisclaimerComment}\n\n${sql}`,
          range: editorModel.getFullModelRange(),
        },
      ])
    } else {
      setSelectedMessage(id)
      const currentSql = editorRef.current?.getValue()
      const diff = { original: currentSql || '', modified: sql }
      setSourceSqlDiff(diff)
      setSelectedDiffType(diffType)
    }
  }

  const acceptAiHandler = useCallback(async () => {
    try {
      setIsAcceptDiffLoading(true)

      if (!sourceSqlDiff) {
        return
      }

      // TODO: show error if undefined
      if (!editorRef.current || !diffEditorRef.current) {
        return
      }

      const editorModel = editorRef.current.getModel()
      const diffModel = diffEditorRef.current.getModel()

      if (!editorModel || !diffModel) {
        return
      }

      const sql = diffModel.modified.getValue()

      if (selectedDiffType === DiffType.NewSnippet) {
        const { title } = await titleSql({ sql })
        await handleNewQuery(sql, title)
      } else {
        editorRef.current.executeEdits('apply-ai-edit', [
          {
            text: sql,
            range: editorModel.getFullModelRange(),
          },
        ])

        if (pendingTitle) {
          snap.renameSnippet(id, pendingTitle)
        }
      }

      Telemetry.sendEvent(
        {
          category: 'sql_editor',
          action: 'ai_suggestion_accepted',
          label: debugSolution ? 'debug_snippet' : 'edit_snippet',
        },
        telemetryProps,
        router
      )

      setAiInput('')
      setSelectedMessage(undefined)
      setSelectedDiffType(DiffType.Modification)
      setDebugSolution(undefined)
      setSourceSqlDiff(undefined)
      setPendingTitle(undefined)
    } finally {
      setIsAcceptDiffLoading(false)
    }
  }, [
    sourceSqlDiff,
    selectedDiffType,
    handleNewQuery,
    titleSql,
    debugSolution,
    telemetryProps,
    router,
    id,
    pendingTitle,
    snap,
  ])

  const discardAiHandler = useCallback(() => {
    Telemetry.sendEvent(
      {
        category: 'sql_editor',
        action: 'ai_suggestion_rejected',
        label: debugSolution ? 'debug_snippet' : 'edit_snippet',
      },
      telemetryProps,
      router
    )

    setSelectedMessage(undefined)
    setDebugSolution(undefined)
    setSourceSqlDiff(undefined)
    setPendingTitle(undefined)
  }, [debugSolution, telemetryProps, router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDiffOpen) {
        return
      }

      switch (e.key) {
        case 'Enter':
          acceptAiHandler()
          return
        case 'Escape':
          discardAiHandler()
          return
      }
    }

    window.addEventListener('keydown', handler)

    return () => window.removeEventListener('keydown', handler)
  }, [isDiffOpen, acceptAiHandler, discardAiHandler])

  useEffect(() => {
    const applyDiff = ({ original, modified }: { original: string; modified: string }) => {
      const model = diffEditorRef.current?.getModel()
      if (model && model.original && model.modified) {
        model.original.setValue(original)
        model.modified.setValue(modified)
      }
    }

    const model = diffEditorRef.current?.getModel()
    try {
      if (model?.original && model.modified && sourceSqlDiff) {
        switch (selectedDiffType) {
          case DiffType.Modification: {
            const transformedDiff = compareAsModification(sourceSqlDiff)
            applyDiff(transformedDiff)
            return
          }

          case DiffType.Addition: {
            const transformedDiff = compareAsAddition(sourceSqlDiff)
            applyDiff(transformedDiff)
            return
          }

          case DiffType.NewSnippet: {
            const transformedDiff = compareAsNewSnippet(sourceSqlDiff)
            applyDiff(transformedDiff)
            return
          }

          default:
            throw new Error(`Unknown diff type '${selectedDiffType}'`)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }, [selectedDiffType, sourceSqlDiff])

  const defaultSqlDiff = useMemo(() => {
    if (!sourceSqlDiff) {
      return { original: '', modified: '' }
    }
    switch (selectedDiffType) {
      case DiffType.Modification: {
        return compareAsModification(sourceSqlDiff)
      }

      case DiffType.Addition: {
        return compareAsAddition(sourceSqlDiff)
      }

      case DiffType.NewSnippet: {
        return compareAsNewSnippet(sourceSqlDiff)
      }

      default:
        return { original: '', modified: '' }
    }
  }, [selectedDiffType, sourceSqlDiff])

  return (
    <SQLEditorContext.Provider
      value={{
        aiInput,
        setAiInput,
        sqlDiff: sourceSqlDiff,
        setSqlDiff: setSourceSqlDiff,
        debugSolution,
        setDebugSolution,
        setSelectedDiffType,
      }}
    >
      <ConfirmModal
        visible={isConfirmModalOpen}
        title="Destructive operation"
        danger
        description="We've detected a potentially destructive operation in the query. Please confirm that you would like to execute this query."
        buttonLabel="Run destructive query"
        onSelectCancel={() => {
          setIsConfirmModalOpen(false)
          // [Joshen] Somehow calling this immediately doesn't work, hence the timeout
          setTimeout(() => editorRef.current?.focus(), 100)
        }}
        onSelectConfirm={() => {
          setIsConfirmModalOpen(false)
          executeQuery(true)
        }}
      />
      <div className="flex h-full">
        <ResizablePanelGroup
          className="h-full relative"
          direction="vertical"
          autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
        >
          {isAiOpen && !hasHipaaAddon && (
            <AISchemaSuggestionPopover
              onClickSettings={() => {
                appSnap.setShowAiSettingsModal(true)
              }}
            >
              <>
                {!isAiAssistantOn ? (
                  <motion.div
                    key="ask-ai-input-container"
                    layoutId="ask-ai-input-container"
                    variants={{ visible: { borderRadius: 0, x: 0 }, hidden: { x: 100 } }}
                    initial={isFirstRender ? 'visible' : 'hidden'}
                    animate="visible"
                    className="w-full flex justify-center z-10 h-[60px] bg-brand-200 border-b border-brand-400 px-5"
                  >
                    <div
                      className={cn(
                        'w-full !border-brand-900 border-none !shadow-none',
                        'flex items-center gap-3'
                      )}
                    >
                      <motion.div layoutId="ask-ai-input-icon" transition={{ duration: 0.1 }}>
                        <AiIconAnimation loading={isAiLoading} />
                      </motion.div>

                      <AnimatePresence initial={false} mode="wait">
                        {debugSolution && (
                          <div className="h-full w-full flex flex-row items-center overflow-y-hidden text-sm text-brand-600">
                            {debugSolution}
                          </div>
                        )}
                        {!isAiLoading && !debugSolution && (
                          <motion.div
                            key="ask-ai-input"
                            className="w-full h-full relative flex items-center"
                            variants={{
                              visible: { opacity: 1, y: 0 },
                              hidden: { opacity: 0, y: -25 },
                            }}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ duration: 0.1 }}
                          >
                            <Input_Shadcn_
                              value={aiInput}
                              onChange={(e) => setAiInput(e.currentTarget.value)}
                              disabled={isDiffOpen}
                              ref={inputRef}
                              className={cn(
                                '!p-0 bg-transparent border-transparent text-sm text-brand-600 placeholder:text-brand-500 focus:!ring-0',
                                'focus-visible:ring-0 focus-visible:ring-offset-0',
                                'appearance-none outline-none'
                              )}
                              placeholder={
                                !debugSolution
                                  ? !snippet?.snippet.content.sql.trim()
                                    ? 'Ask Supabase AI to build a query'
                                    : 'Ask Supabase AI to modify your query'
                                  : ''
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Escape' && !aiInput) {
                                  setIsAiOpen(false)
                                }
                              }}
                              onKeyPress={async (e) => {
                                if (e.key === 'Enter') {
                                  try {
                                    const prompt = e.currentTarget.value

                                    if (!prompt) {
                                      return
                                    }

                                    const currentSql = editorRef.current?.getValue()

                                    let sql: string | undefined
                                    let title: string | undefined

                                    if (!currentSql) {
                                      ;({ sql, title } = await generateSql({
                                        prompt,
                                        entityDefinitions,
                                      }))
                                    } else {
                                      ;({ sql } = await editSql({
                                        prompt,
                                        sql: currentSql.replace(sqlAiDisclaimerComment, '').trim(),
                                        entityDefinitions,
                                      }))
                                    }

                                    setAiQueryCount((count) => count + 1)

                                    const formattedSql = format(sql, {
                                      language: 'postgresql',
                                      keywordCase: 'lower',
                                    })

                                    // If this was an edit and AI returned the same SQL as before
                                    if (currentSql && formattedSql.trim() === currentSql.trim()) {
                                      toast.error(
                                        'Unable to edit SQL. Try adding more details to your prompt.'
                                      )
                                      return
                                    }

                                    setSourceSqlDiff({
                                      original: currentSql ?? '',
                                      modified: formattedSql,
                                    })
                                    setSelectedDiffType(DiffType.Modification)

                                    if (title) setPendingTitle(title)
                                  } catch (error: unknown) {
                                    if (isError(error)) toast.error(error.message)
                                  }
                                }
                              }}
                            />
                          </motion.div>
                        )}
                        {isAiLoading && (
                          <motion.div
                            key="ask-ai-loading"
                            className="p-0 flex flex-row gap-2 items-center w-full"
                            variants={{
                              visible: { opacity: 1, y: 0 },
                              hidden: { opacity: 0, y: 25 },
                            }}
                            transition={{ duration: 0.2 }}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                          >
                            <motion.span
                              className="text-sm text-brand-600 px-3"
                              animate={{
                                opacity: ['0.5', '0.75', '0.5'],
                                transition: { ease: 'linear', duration: 0.33, repeat: Infinity },
                              }}
                            >
                              Thinking...
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex flex-row items-center gap-3 mr-1">
                        {isDiffOpen ? (
                          <DiffActionBar
                            loading={isAcceptDiffLoading}
                            selectedDiffType={selectedDiffType || DiffType.Modification}
                            onChangeDiffType={(diffType) => setSelectedDiffType(diffType)}
                            onAccept={acceptAiHandler}
                            onCancel={discardAiHandler}
                          />
                        ) : (
                          <>
                            <div
                              className={cn(
                                'transition text-brand-600',
                                !aiInput ? 'opacity-0' : 'opacity-100'
                              )}
                            >
                              <IconCornerDownLeft size={16} strokeWidth={1.5} />
                            </div>
                            <button
                              onClick={() => {
                                setIsSchemaSuggestionDismissed(true)
                                appSnap.setShowAiSettingsModal(true)
                              }}
                              className="text-brand-600 hover:text-brand-600 transition"
                            >
                              <IconSettings className="cursor-pointer" />
                            </button>
                            <button
                              className="transition text-brand-500 hover:text-brand-600"
                              onClick={() => setIsAiOpen(false)}
                            >
                              <IconX size={21} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : isDiffOpen ? (
                  <motion.div
                    key="ask-ai-input-container"
                    layoutId="ask-ai-input-container"
                    variants={{ visible: { borderRadius: 0, x: 0 }, hidden: { x: 100 } }}
                    initial={isFirstRender ? 'visible' : 'hidden'}
                    animate="visible"
                    className={cn(
                      'flex flex-row items-center gap-3 justify-end px-2 py-2 w-full z-10',
                      'bg-brand-200 border-b border-brand-400  !shadow-none'
                    )}
                  >
                    {debugSolution && (
                      <div className="h-full w-full flex flex-row items-center overflow-y-hidden text-sm text-brand-600">
                        {debugSolution}
                      </div>
                    )}
                    <DiffActionBar
                      loading={isAcceptDiffLoading}
                      selectedDiffType={selectedDiffType || DiffType.Modification}
                      onChangeDiffType={(diffType) => setSelectedDiffType(diffType)}
                      onAccept={acceptAiHandler}
                      onCancel={discardAiHandler}
                    />
                  </motion.div>
                ) : null}
              </>
            </AISchemaSuggestionPopover>
          )}
          <ResizablePanel collapsible collapsedSize={10} minSize={20}>
            <div className="flex-grow overflow-y-auto border-b h-full">
              {!isAiOpen && (
                <motion.button
                  layoutId="ask-ai-input-icon"
                  transition={{ duration: 0.1 }}
                  onClick={() => setIsAiOpen(!isAiOpen)}
                  className={cn(
                    'group absolute z-10 rounded-lg right-[24px] top-4 transition-all duration-200 ease-out'
                  )}
                >
                  <AiIconAnimation loading={false} allowHoverEffect />
                </motion.button>
              )}

              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loading active={true}>
                    <></>
                  </Loading>
                </div>
              ) : (
                <>
                  {isDiffOpen && (
                    <motion.div
                      className="w-full h-full"
                      variants={{
                        visible: { opacity: 1, filter: 'blur(0px)' },
                        hidden: { opacity: 0, filter: 'blur(10px)' },
                      }}
                      initial="hidden"
                      animate="visible"
                    >
                      <DiffEditor
                        theme="supabase"
                        language="pgsql"
                        original={defaultSqlDiff.original}
                        modified={defaultSqlDiff.modified}
                        onMount={(editor) => {
                          diffEditorRef.current = editor

                          // This logic deducts whether the diff should be addition or replacement on initial diffing.
                          // With the AI assistant is not necessary because it has separate buttons for addition and
                          // replacement. Using this logic with the AI assistant would probably annoy the users.
                          if (isAiAssistantOn) {
                            return
                          }
                          let isFirstLoad = true

                          editor.onDidUpdateDiff(() => {
                            if (!isFirstLoad) {
                              return
                            }

                            const model = editor.getModel()
                            const lineChanges = editor.getLineChanges()

                            if (!model || !lineChanges || lineChanges.length === 0) {
                              return
                            }

                            const original = model.original.getValue()
                            const formattedOriginal = format(
                              original.replace(sqlAiDisclaimerComment, '').trim(),
                              {
                                language: 'postgresql',
                                keywordCase: 'lower',
                              }
                            )

                            const modified = model.modified.getValue()

                            const lineStart = original.includes(sqlAiDisclaimerComment)
                              ? (sqlAiDisclaimerComment + '\n\n').split('\n').length
                              : 0
                            const lineEnd = model.original.getLineCount()
                            const totalLines = lineEnd - lineStart

                            // If any change overwrites >50% of the original code,
                            // and the the modified code doesn't contain the original code,
                            // predict that this is an addition instead of a modification
                            const isAddition =
                              lineChanges.some(
                                (lineChange) =>
                                  lineChange.originalEndLineNumber -
                                    lineChange.originalStartLineNumber >
                                  totalLines * 0.5
                              ) && !modified.includes(formattedOriginal)

                            if (isAddition) {
                              setSelectedDiffType(DiffType.Addition)
                            }
                            isFirstLoad = false
                          })
                        }}
                        options={{ fontSize: 13 }}
                      />
                    </motion.div>
                  )}
                  <motion.div
                    key={id}
                    variants={{
                      visible: { opacity: 1, filter: 'blur(0px)' },
                      hidden: { opacity: 0, filter: 'blur(10px)' },
                    }}
                    initial="hidden"
                    animate={isDiffOpen ? 'hidden' : 'visible'}
                    className="w-full h-full"
                  >
                    <MonacoEditor
                      autoFocus
                      id={id}
                      editorRef={editorRef}
                      monacoRef={monacoRef}
                      executeQuery={executeQuery}
                      onHasSelection={setHasSelection}
                    />
                  </motion.div>
                </>
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel collapsible collapsedSize={10} minSize={20}>
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loading active={true}>
                  <></>
                </Loading>
              </div>
            ) : (
              <UtilityPanel
                id={id}
                isExecuting={isExecuting}
                isDisabled={isDiffOpen}
                hasSelection={hasSelection}
                prettifyQuery={prettifyQuery}
                executeQuery={executeQuery}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
        {isAiOpen && isAiAssistantOn && (
          <AiAssistantPanel
            messages={messages}
            selectedMessage={selectedMessage}
            loading={isLoadingChat}
            onSubmit={(message) =>
              append({
                content: message,
                role: 'user',
                createdAt: new Date(),
              })
            }
            onDiff={updateEditorWithCheckForDiff}
            onChange={() => {}}
            onClose={() => setIsAiOpen(false)}
          />
        )}
      </div>
    </SQLEditorContext.Provider>
  )
}

export default SQLEditor
