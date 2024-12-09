import type { Monaco } from '@monaco-editor/react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronUp, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Separator } from '@ui/components/SidePanel/SidePanel'
import { useParams } from 'common'
import { GridFooter } from 'components/ui/GridFooter'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { lintKeys } from 'data/lint/keys'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useFormatQueryMutation } from 'data/sql/format-sql-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { isError } from 'data/utils/error-check'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
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
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import { DiffActionBar } from './DiffActionBar'
import {
  ROWS_PER_PAGE_OPTIONS,
  sqlAiDisclaimerComment,
  untitledSnippetTitle,
} from './SQLEditor.constants'
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
  createSqlSnippetSkeletonV2,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import UtilityPanel from './UtilityPanel/UtilityPanel'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })
const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

export const SQLEditor = () => {
  const router = useRouter()
  const { ref, id: urlId } = useParams()

  // generate an id to be used for new snippets. The dependency on urlId is to avoid a bug which
  // shows up when clicking on the SQL Editor while being in the SQL editor on a random snippet.
  const generatedId = useMemo(() => uuidv4(), [urlId])
  // the id is stable across renders - it depends either on the url or on the memoized generated id
  const id = !urlId || urlId === 'new' ? generatedId : urlId

  const { profile } = useProfile()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()
  const appSnap = useAppStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const getImpersonatedRole = useGetImpersonatedRole()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const queryClient = useQueryClient()

  const { mutate: formatQuery } = useFormatQueryMutation()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

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

  const [showPotentialIssuesModal, setShowPotentialIssuesModal] = useState(false)
  const [queryHasDestructiveOperations, setQueryHasDestructiveOperations] = useState(false)
  const [queryHasUpdateWithoutWhere, setQueryHasUpdateWithoutWhere] = useState(false)

  const isOptedInToAI = useOrgOptedIntoAi()
  const [selectedSchemas] = useSchemasForAi(project?.ref!)
  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const [isAcceptDiffLoading, setIsAcceptDiffLoading] = useState(false)
  const [, setAiQueryCount] = useLocalStorageQuery('supabase_sql-editor-ai-query-count', 0)

  const [selectedDiffType, setSelectedDiffType] = useState<DiffType | undefined>(undefined)
  const [isFirstRender, setIsFirstRender] = useState(true)
  const [lineHighlights, setLineHighlights] = useState<string[]>([])

  const { data, refetch: refetchEntityDefinitions } = useEntityDefinitionsQuery(
    {
      schemas: selectedSchemas,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined
  const isDiffOpen = !!sourceSqlDiff

  const limit = snapV2.limit
  const results = snapV2.results[id]?.[0]
  const snippetIsLoading = !(
    id in snapV2.snippets && snapV2.snippets[id].snippet.content !== undefined
  )
  const isLoading = urlId === 'new' ? false : snippetIsLoading

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
              snapV2.setSql(id, res.result)
            }
          },
        }
      )
    }
  }, [formatQuery, id, isDiffOpen, project, snapV2])

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
          ? (selectedValue || editorRef.current?.getValue()) ?? snippet.snippet.content.sql
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
    [profile?.id, project?.id, ref, router, snapV2]
  )

  const updateEditorWithCheckForDiff = useCallback(
    ({ diffType, sql }: { diffType: DiffType; sql: string }) => {
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
      const snippet = snapV2.snippets[id]
      const result = snapV2.results[id]?.[0]
      appSnap.setAiAssistantPanel({
        open: true,
        sqlSnippets: [snippet.snippet.content.sql.replace(sqlAiDisclaimerComment, '').trim()],
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
  }, [debugSql, entityDefinitions, id, snapV2.results, snapV2.snippets])

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
          snapV2.renameSnippet({ id, name: pendingTitle })
        }
      }

      sendEvent({
        category: 'sql_editor',
        action: 'ai_suggestion_accepted',
        label: 'edit_snippet',
      })

      setSelectedDiffType(DiffType.Modification)
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
    router,
    id,
    pendingTitle,
    snapV2,
  ])

  const discardAiHandler = useCallback(() => {
    sendEvent({
      category: 'sql_editor',
      action: 'ai_suggestion_rejected',
      label: 'edit_snippet',
    })

    setSourceSqlDiff(undefined)
    setPendingTitle(undefined)
  }, [router])

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

  useEffect(() => {
    if (snapV2.diffContent !== undefined) {
      updateEditorWithCheckForDiff(snapV2.diffContent)
    }
  }, [snapV2.diffContent])

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
      <ConfirmationModal
        visible={showPotentialIssuesModal}
        size="large"
        title={`Potential issue${queryHasDestructiveOperations && queryHasUpdateWithoutWhere ? 's' : ''} detected with your query`}
        confirmLabel="Run this query"
        variant="warning"
        alert={{
          base: {
            variant: 'warning',
          },
          title:
            queryHasDestructiveOperations && queryHasUpdateWithoutWhere
              ? 'The following potential issues have been detected:'
              : 'The following potential issue has been detected:',
          description: 'Ensure that these are intentional before executing this query',
        }}
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
      >
        <div className="text-sm">
          <ul className="border rounded-md grid bg-surface-200">
            {queryHasDestructiveOperations && (
              <li className="grid pt-3 pb-2 px-4">
                <span className="font-bold">Query has destructive operation</span>
                <span className="text-foreground-lighter">
                  Make sure you are not accidentally removing something important.
                </span>
              </li>
            )}
            {queryHasDestructiveOperations && queryHasUpdateWithoutWhere && <Separator />}
            {queryHasUpdateWithoutWhere && (
              <li className="grid pt-2 pb-3 px-4 gap-1">
                <span className="font-bold">Query uses update without a where clause</span>
                <span className="text-foreground-lighter">
                  Without a <code className="text-xs">where</code> clause, this could update all
                  rows in the table.
                </span>
              </li>
            )}
          </ul>
        </div>
        <p className="mt-4 text-sm text-foreground-light">
          Please confirm that you would like to execute this query.
        </p>
      </ConfirmationModal>

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
            {!hasHipaaAddon && isDiffOpen && (
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
                <DiffActionBar
                  loading={isAcceptDiffLoading}
                  selectedDiffType={selectedDiffType || DiffType.Modification}
                  onChangeDiffType={(diffType) => setSelectedDiffType(diffType)}
                  onAccept={acceptAiHandler}
                  onCancel={discardAiHandler}
                />
              </motion.div>
            )}
            <ResizablePanel maxSize={70}>
              <div className="flex-grow overflow-y-auto border-b h-full">
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
                  isDebugging={isDebugSqlLoading}
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
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_>
                      <p className="text-xs">
                        <span className="text-foreground">
                          {results.rows.length} row{results.rows.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-foreground-lighter ml-1">
                          {results.autoLimit !== undefined &&
                            ` (Limited to only ${results.autoLimit} rows)`}
                        </span>
                      </p>
                    </TooltipTrigger_Shadcn_>
                    <TooltipContent_Shadcn_ className="max-w-xs">
                      <p className="flex flex-col gap-y-1">
                        <span>
                          Results are automatically limited to preserve browser performance, in
                          particular if your query returns an exceptionally large number of rows.
                        </span>

                        <span className="text-foreground-light">
                          You may change or remove this limit from the dropdown on the right
                        </span>
                      </p>
                    </TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
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
