import type { Monaco } from '@monaco-editor/react'
import { useChat } from 'ai/react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams, useTelemetryProps } from 'common'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useFormatQueryMutation } from 'data/sql/format-sql-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { isError } from 'data/utils/error-check'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { BASE_PATH, IS_PLATFORM, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { wrapWithRoleImpersonation } from 'lib/role-impersonation'
import Telemetry from 'lib/telemetry'
import { format } from 'sql-formatter'
import { useAppStateSnapshot } from 'state/app-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { isRoleImpersonationEnabled, useGetImpersonatedRole } from 'state/role-impersonation-state'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  AiIconAnimation,
  Loading,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  cn,
} from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
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
} from './SQLEditor.types'
import {
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  compareAsAddition,
  compareAsModification,
  compareAsNewSnippet,
  createSqlSnippetSkeleton,
  suffixWithLimit,
} from './SQLEditor.utils'
import UtilityPanel from './UtilityPanel/UtilityPanel'
import { Loader2 } from 'lucide-react'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

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
  const snapV2 = useSqlEditorV2StateSnapshot()
  const getImpersonatedRole = useGetImpersonatedRole()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const enableFolders = useFlag('sqlFolderOrganization')

  const { mutate: formatQuery } = useFormatQueryMutation()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

  const [selectedMessage, setSelectedMessage] = useState<string>()
  const [debugSolution, setDebugSolution] = useState<string>()
  const [sourceSqlDiff, setSourceSqlDiff] = useState<ContentDiff>()
  const [pendingTitle, setPendingTitle] = useState<string>()
  const [hasSelection, setHasSelection] = useState<boolean>(false)

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery({
    projectRef: ref,
  })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const [isAiOpen, setIsAiOpen] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_OPEN, true)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const selectedOrganization = useSelectedOrganization()
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA, true)
  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  const [isAcceptDiffLoading, setIsAcceptDiffLoading] = useState(false)
  const [, setAiQueryCount] = useLocalStorageQuery('supabase_sql-editor-ai-query-count', 0)

  // Use chat id because useChat doesn't have a reset function to clear all messages
  const [chatId, setChatId] = useState(uuidv4())
  const [selectedDiffType, setSelectedDiffType] = useState<DiffType | undefined>(undefined)
  const [isFirstRender, setIsFirstRender] = useState(true)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])

  const { data, refetch: refetchEntityDefinitions } = useEntityDefinitionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined
  const isDiffOpen = !!sourceSqlDiff

  const snippetIsLoading = enableFolders
    ? !(id in snapV2.snippets && snapV2.snippets[id].snippet.content !== undefined)
    : !(id && ref && snap.loaded[ref])
  const isLoading = urlId === 'new' ? false : snippetIsLoading

  const {
    messages: chatMessages,
    append,
    isLoading: isLoadingChat,
  } = useChat({
    id: chatId,
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
    onSuccess(data, vars) {
      if (id) {
        if (enableFolders) snapV2.addResult(id, data.result, vars.autoLimit)
        else snap.addResult(id, data.result, vars.autoLimit)
      }

      // Refetching instead of invalidating since invalidate doesn't work with `enabled` flag
      refetchEntityDefinitions()
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

        if (enableFolders) snapV2.addResultError(id, error, vars.autoLimit)
        else snap.addResultError(id, error, vars.autoLimit)
      }
    },
  })

  const setAiTitle = useCallback(
    async (id: string, sql: string) => {
      try {
        const { title: name } = await generateSqlTitle({ sql })

        if (enableFolders) {
          snapV2.renameSnippet({ id, name })
        } else {
          snap.renameSnippet(id, name)
        }
      } catch (error) {
        // [Joshen] No error handler required as this happens in the background and not necessary to ping the user
      }
    },
    [generateSqlTitle, snap]
  )

  const prettifyQuery = useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = enableFolders ? getSqlEditorV2StateSnapshot() : getSqlEditorStateSnapshot()
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

  const executeQuery = useCallback(
    async (force: boolean = false) => {
      if (isDiffOpen) return

      // use the latest state
      const state = enableFolders ? getSqlEditorV2StateSnapshot() : getSqlEditorStateSnapshot()
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
        const connectionString = databases?.find(
          (db) => db.identifier === databaseSelectorState.selectedDatabaseId
        )?.connectionString
        if (IS_PLATFORM && !connectionString) {
          return toast.error('Unable to run query: Connection string is missing')
        }

        const { appendAutoLimit } = checkIfAppendLimitRequired(sql, snap.limit)
        const formattedSql = suffixWithLimit(sql, snap.limit)

        execute({
          projectRef: project.ref,
          connectionString: connectionString,
          sql: wrapWithRoleImpersonation(formattedSql, {
            projectRef: project.ref,
            role: impersonatedRole,
          }),
          autoLimit: appendAutoLimit ? snap.limit : undefined,
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

  const updateEditorWithCheckForDiff = useCallback(
    ({ id, diffType, sql }: { id: string; diffType: DiffType; sql: string }) => {
      const editorModel = editorRef.current?.getModel()
      if (!editorModel) return

      setAiQueryCount((count) => count + 1)

      const existingValue = editorRef.current?.getValue() ?? ''
      if (existingValue.length === 0) {
        // if the editor is empty, just copy over the code
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
    },
    [setAiQueryCount]
  )

  const onDebug = useCallback(async () => {
    try {
      const snippet = enableFolders ? snapV2.snippets[id] : snap.snippets[id]
      const result = enableFolders ? snapV2.results[id]?.[0] : snap.results[id]?.[0]

      const { solution, sql } = await debugSql({
        sql: snippet.snippet.content.sql.replace(sqlAiDisclaimerComment, '').trim(),
        errorMessage: result.error.message,
        entityDefinitions,
      })

      const formattedSql =
        sqlAiDisclaimerComment +
        '\n\n' +
        format(sql, {
          language: 'postgresql',
          keywordCase: 'lower',
        })
      setDebugSolution(solution)
      setSourceSqlDiff({
        original: snippet.snippet.content.sql,
        modified: formattedSql,
      })
      setSelectedDiffType(DiffType.Modification)
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
  }, [debugSql, entityDefinitions, id, snap.results, snap.snippets])

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
    generateSqlTitle,
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
    <>
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
          {(isAiOpen || isDiffOpen) && !hasHipaaAddon && (
            <AISchemaSuggestionPopover
              onClickSettings={() => {
                appSnap.setShowAiSettingsModal(true)
              }}
            >
              {isDiffOpen ? (
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
                  <Loader2 className="animate-spin text-brand" />
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
                <Loader2 className="animate-spin text-brand" />
              </div>
            ) : (
              <UtilityPanel
                id={id}
                isExecuting={isExecuting}
                isDisabled={isDiffOpen}
                isDebugging={isDebugSqlLoading}
                hasSelection={hasSelection}
                prettifyQuery={prettifyQuery}
                executeQuery={executeQuery}
                onDebug={onDebug}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>

        {isAiOpen && (
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
            onClearHistory={() => setChatId(uuidv4())}
            onDiff={updateEditorWithCheckForDiff}
            onClose={() => setIsAiOpen(false)}
          />
        )}
      </div>
    </>
  )
}

export default SQLEditor
